import { create } from 'zustand';
import type { User } from '../types';
import * as usersApi from '../api/users';

interface FriendsState {
  friends: User[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  fetchFriends: () => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFriends: async () => {
    set({ loading: true, error: null });
    try {
      const friends = await usersApi.fetchFriends('accepted');
      set({ friends, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Ошибка загрузки друзей' });
    }
  },

  addFriend: async (friendId) => {
    try {
      await usersApi.addFriend(friendId);
      const friend = await usersApi.fetchUser(friendId);
      set((s) => ({ friends: [...s.friends, friend] }));
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка добавления друга' });
    }
  },

  removeFriend: async (friendId) => {
    try {
      await usersApi.removeFriend(friendId);
      set((s) => ({ friends: s.friends.filter((f) => f.id !== friendId) }));
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка удаления друга' });
    }
  },
}));
