import { api, camelize } from './client';
import type { Group } from '../types';

export const fetchGroups = () =>
  api<{ groups: Group[] }>('/groups').then((r) => camelize<Group[]>(r.groups));

export const fetchGroup = (id: string) =>
  api<{ group: Group }>(`/groups/${id}`).then((r) => camelize<Group>(r.group));

export const createGroup = (data: { name: string; member_ids?: string[] }) =>
  api<{ group: Group }>('/groups', { method: 'POST', body: data }).then((r) => camelize<Group>(r.group));

export const addGroupMember = (groupId: string, userId: string) =>
  api(`/groups/${groupId}/members`, { method: 'POST', body: { user_id: userId } });

export const removeGroupMember = (groupId: string, userId: string) =>
  api(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
