import { create } from 'zustand';
import type { Notification } from '../types';
import { mockNotifications } from '../mocks';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.read).length,
  markRead: (id) => {
    const notifications = get().notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  },
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));
