import { create } from 'zustand';
import type { Group, GroupMember } from '../types';
import { mockGroups } from '../mocks';
import { mockUsers } from '../mocks';
import { useAuthStore } from './authStore';

interface GroupsState {
  groups: Group[];
  addGroup: (group: Group) => void;
  addMember: (groupId: string, userId: string) => void;
  removeMember: (groupId: string, userId: string) => void;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: mockGroups,
  addGroup: (group) => set((s) => ({ groups: [group, ...s.groups] })),
  addMember: (groupId, userId) => set((s) => ({
    groups: s.groups.map((g) => g.id !== groupId ? g : {
      ...g,
      members: [...(g.members || []), {
        id: `gm-${Date.now()}`,
        group_id: groupId,
        user_id: userId,
        role: 'member' as const,
        joined_at: new Date().toISOString(),
        user: mockUsers.find((u) => u.id === userId) ?? useAuthStore.getState().user ?? undefined,
      }],
    }),
  })),
  removeMember: (groupId, userId) => set((s) => ({
    groups: s.groups.map((g) => g.id !== groupId ? g : {
      ...g,
      members: (g.members || []).filter((m) => m.user_id !== userId),
    }),
  })),
}));
