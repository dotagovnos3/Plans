import type { FastifyInstance } from 'fastify';
import { pool, query } from '../db/pool.js';
import { insertNotification } from '../db/notifications.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_RE.test(value);
}

function mapMember(row: any) {
  return {
    id: row.id,
    group_id: row.group_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    user: {
      id: row.u_id,
      phone: row.u_phone,
      name: row.u_name,
      username: row.u_username,
      avatar_url: row.u_avatar,
      created_at: row.u_created,
    },
  };
}

async function loadMembers(groupIds: string[]) {
  const membersByGroup = new Map<string, any[]>();
  if (groupIds.length === 0) return membersByGroup;

  const memberRows = (await query(
    `SELECT gm.*, u.id as u_id, u.phone as u_phone, u.name as u_name, u.username as u_username, u.avatar_url as u_avatar, u.created_at as u_created
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     WHERE gm.group_id = ANY($1::uuid[])
     ORDER BY gm.joined_at ASC`,
    [groupIds]
  )).rows;

  for (const row of memberRows) {
    const next = membersByGroup.get(row.group_id) || [];
    next.push(mapMember(row));
    membersByGroup.set(row.group_id, next);
  }

  return membersByGroup;
}

async function loadAccessibleGroups(userId: string) {
  const groupRows = (await query(
    `SELECT g.*
     FROM groups g
     WHERE g.creator_id = $1
       OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $1)
     ORDER BY g.created_at DESC`,
    [userId]
  )).rows;

  const membersByGroup = await loadMembers(groupRows.map((row: any) => row.id));
  return groupRows.map((row: any) => ({ ...row, members: membersByGroup.get(row.id) || [] }));
}

async function loadAccessibleGroup(userId: string, groupId: string) {
  const group = (await query(
    `SELECT g.*
     FROM groups g
     WHERE g.id = $1
       AND (
         g.creator_id = $2
         OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $2)
       )`,
    [groupId, userId]
  )).rows[0];

  if (!group) return null;

  const membersByGroup = await loadMembers([groupId]);
  return { ...group, members: membersByGroup.get(groupId) || [] };
}

export async function groupRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [(app as any).authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    const groups = await loadAccessibleGroups(userId);
    return { groups };
  });

  app.post('/', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { name, member_ids } = request.body as { name: string; member_ids: string[] };
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName || trimmedName.length > 100) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'name must be 1-100 chars' });
    if (member_ids && !Array.isArray(member_ids)) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'member_ids must be an array' });

    const inviteeIds = [...new Set((member_ids || []).filter((id) => id !== userId))];
    if (inviteeIds.some((id) => typeof id !== 'string' || !isUuid(id))) {
      return reply.code(400).send({ code: 'INVALID_INPUT', message: 'member_ids must contain valid uuids' });
    }
    if (inviteeIds.length > 0) {
      const existingUsers = (await query('SELECT id FROM users WHERE id = ANY($1::uuid[])', [inviteeIds])).rows;
      if (existingUsers.length !== inviteeIds.length) {
        return reply.code(400).send({ code: 'INVALID_INPUT', message: 'member_ids contains unknown user' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const group = (await client.query('INSERT INTO groups (creator_id, name) VALUES ($1, $2) RETURNING *', [userId, trimmedName])).rows[0];
      await client.query("INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')", [group.id, userId]);

      const inviterName = (await client.query('SELECT name FROM users WHERE id = $1', [userId])).rows[0]?.name;
      for (const mid of inviteeIds) {
        await client.query("INSERT INTO invitations (type, target_id, inviter_id, invitee_id, status) VALUES ('group', $1, $2, $3, 'pending')", [group.id, userId, mid]);
        await insertNotification(mid, 'group_invite', { group_id: group.id, inviter_name: inviterName }, (sql, p) => client.query(sql, p));
      }

      await client.query('COMMIT');

      const createdGroup = await loadAccessibleGroup(userId, group.id);
      return reply.code(201).send({ group: createdGroup });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  app.get('/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    if (!isUuid(id)) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'id must be a valid uuid' });

    const group = await loadAccessibleGroup(userId, id);
    if (!group) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Group not found' });
    return { group };
  });

  app.post('/:id/members', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const { user_id } = request.body as { user_id: string };
    if (!isUuid(id)) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'id must be a valid uuid' });
    if (!user_id || !isUuid(user_id)) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'user_id must be a valid uuid' });
    if (user_id === userId) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'Cannot invite yourself' });
    const group = (await query('SELECT * FROM groups WHERE id = $1', [id])).rows[0];
    if (!group) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Group not found' });
    if (group.creator_id !== userId) return reply.code(403).send({ code: 'FORBIDDEN', message: 'Only creator can add members' });

    const invitee = (await query('SELECT 1 FROM users WHERE id = $1', [user_id])).rows[0];
    if (!invitee) return reply.code(404).send({ code: 'NOT_FOUND', message: 'User not found' });

    const existingMember = (await query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [id, user_id])).rows[0];
    if (existingMember) return reply.code(409).send({ code: 'ALREADY_MEMBER', message: 'User is already a group member' });

    const pendingInvite = (await query(
      "SELECT 1 FROM invitations WHERE type = 'group' AND target_id = $1 AND invitee_id = $2 AND status = 'pending'",
      [id, user_id]
    )).rows[0];
    if (pendingInvite) return reply.code(409).send({ code: 'ALREADY_INVITED', message: 'Pending invitation already exists' });

    // Only create invitation — member is added when invitation is accepted
    await query("INSERT INTO invitations (type, target_id, inviter_id, invitee_id, status) VALUES ('group', $1, $2, $3, 'pending')", [id, userId, user_id]);
    const inviterName = (await query('SELECT name FROM users WHERE id = $1', [userId])).rows[0]?.name;
    await insertNotification(user_id, 'group_invite', { group_id: id, inviter_name: inviterName });

    return reply.code(201).send({ code: 'OK', message: 'Invitation sent' });
  });

  app.delete('/:id/members/:uid', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id, uid } = request.params as { id: string; uid: string };
    if (!isUuid(id) || !isUuid(uid)) return reply.code(400).send({ code: 'INVALID_INPUT', message: 'id and uid must be valid uuids' });
    const group = (await query('SELECT * FROM groups WHERE id = $1', [id])).rows[0];
    if (!group) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Group not found' });
    if (uid !== userId && group.creator_id !== userId) return reply.code(403).send({ code: 'FORBIDDEN', message: 'Cannot remove this member' });
    await query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [id, uid]);
    return reply.code(204).send();
  });
}
