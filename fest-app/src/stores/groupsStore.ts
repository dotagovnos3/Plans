import { create } from 'zustand';
import type { Group, GroupMember } from '../types';
import * as groupsApi from '../api/groups';

interface GroupsState {
  groups: Group[];
  fetchGroups: () => Promise<void>;
  apiCreateGroup: (name: string, memberIds?: string[]) => Promise<string | null>;
  apiAddMember: (groupId: string, userId: string) => Promise<void>;
  apiRemoveMember: (groupId: string, userId: string) => Promise<void>;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],

  fetchGroups: async () => {
    try {
      const groups = await groupsApi.fetchGroups();
      set({ groups });
    } catch {}
  },

  apiCreateGroup: async (name, memberIds) => {
    try {
      const group = await groupsApi.createGroup({ name, member_ids: memberIds });
      set((s) => ({ groups: [group, ...s.groups] }));
      return group.id;
    } catch {
      return null;
    }
  },

  apiAddMember: async (groupId, userId) => {
    try {
      await groupsApi.addGroupMember(groupId, userId);
      const updated = await groupsApi.fetchGroup(groupId);
      set((s) => ({
        groups: s.groups.map((g) => g.id !== groupId ? g : updated),
      }));
    } catch {}
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
    } catch {}
  },
}));
