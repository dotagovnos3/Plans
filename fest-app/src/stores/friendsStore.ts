import { create } from 'zustand';
import type { User } from '../types';
import * as usersApi from '../api/users';

interface FriendsState {
  friends: User[];
  fetchFriends: () => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],

  fetchFriends: async () => {
    try {
      const friends = await usersApi.fetchFriends('accepted');
      set({ friends });
    } catch {}
  },

  addFriend: async (friendId) => {
    try {
      await usersApi.addFriend(friendId);
      const friend = await usersApi.fetchUser(friendId);
      set((s) => ({ friends: [...s.friends, friend] }));
    } catch {}
  },

  removeFriend: async (friendId) => {
    try {
      await usersApi.removeFriend(friendId);
      set((s) => ({ friends: s.friends.filter((f) => f.id !== friendId) }));
    } catch {}
  },
}));
