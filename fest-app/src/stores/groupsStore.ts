import { create } from 'zustand';
import type { Group } from '../types';
import { mockGroups } from '../mocks';

interface GroupsState {
  groups: Group[];
  addGroup: (group: Group) => void;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: mockGroups,
  addGroup: (group) => set((s) => ({ groups: [group, ...s.groups] })),
}));
