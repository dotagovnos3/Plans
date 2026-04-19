import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';

export async function notificationRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [(app as any).authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    const { page = '1', limit = '50' } = request.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const lmt = Math.min(parseInt(limit), 100);
    const notifications = (await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, lmt, offset]
    )).rows;
    const unread_count = parseInt((await query('SELECT COUNT(*) as c FROM notifications WHERE user_id = $1 AND read = false', [userId])).rows[0].c);
    return { notifications, unread_count };
  });

  app.patch('/:id/read', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const r = (await query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId])).rows[0];
    if (!r) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Notification not found' });
    return { notification: r };
  });

  app.patch('/read-all', { preHandler: [(app as any).authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    await query('UPDATE notifications SET read = true WHERE user_id = $1 AND read = false', [userId]);
    return {};
  });
}
