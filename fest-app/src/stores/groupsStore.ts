import { create } from 'zustand';
import type { Group } from '../types';
import * as groupsApi from '../api/groups';

interface GroupsState {
  groups: Group[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<Group | null>;
  apiCreateGroup: (name: string, memberIds?: string[]) => Promise<string | null>;
  apiAddMember: (groupId: string, userId: string) => Promise<void>;
  apiRemoveMember: (groupId: string, userId: string) => Promise<void>;
}

const upsertGroup = (groups: Group[], updated: Group) =>
  groups.some((group) => group.id === updated.id)
    ? groups.map((group) => (group.id === updated.id ? updated : group))
    : [updated, ...groups];

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const groups = await groupsApi.fetchGroups();
      set({ groups, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Ошибка загрузки групп' });
    }
  },

  fetchGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      const group = await groupsApi.fetchGroup(groupId);
      set((s) => ({ groups: upsertGroup(s.groups, group), loading: false }));
      return group;
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Ошибка загрузки группы' });
      return null;
    }
  },

  apiCreateGroup: async (name, memberIds) => {
    try {
      const group = await groupsApi.createGroup({ name, member_ids: memberIds });
      set((s) => ({ groups: upsertGroup(s.groups, group) }));
      return group.id;
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка создания группы' });
      return null;
    }
  },

  apiAddMember: async (groupId, userId) => {
    try {
      await groupsApi.addGroupMember(groupId, userId);
      const updated = await groupsApi.fetchGroup(groupId);
      set((s) => ({
        groups: upsertGroup(s.groups, updated),
      }));
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка добавления участника' });
    }
  },

  apiRemoveMember: async (groupId, userId) => {
    try {
      await groupsApi.removeGroupMember(groupId, userId);
      set((s) => ({
        groups: s.groups.map((g) => g.id !== groupId ? g : {
          ...g,
          members: (g.members || []).filter((m) => m.user_id !== userId),
        }),
      }));
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка удаления участника' });
    }
  },
}));
