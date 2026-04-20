import { create } from 'zustand';
import type { Invitation, InvitationStatus } from '../types';
import * as invitationsApi from '../api/invitations';
import { usePlansStore } from './plansStore';

interface InvitationsState {
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  accept: (id: string) => Promise<void>;
  decline: (id: string) => Promise<void>;
  fetchInvitations: () => Promise<void>;
}

export const useInvitationsStore = create<InvitationsState>((set, get) => ({
  invitations: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  accept: async (id) => {
    const inv = get().invitations.find((i) => i.id === id);
    if (!inv) return;
    const prev = get().invitations;
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === id ? { ...i, status: 'accepted' as InvitationStatus } : i
      ),
    }));
    try {
      await invitationsApi.acceptInvitation(id);
      if (inv.type === 'plan') {
        await usePlansStore.getState().fetchPlan(inv.target_id);
      }
    } catch (e: any) {
      set({ invitations: prev, error: e?.message || 'Ошибка принятия приглашения' });
    }
  },

  decline: async (id) => {
    const prev = get().invitations;
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === id ? { ...i, status: 'declined' as InvitationStatus } : i
      ),
    }));
    try {
      await invitationsApi.declineInvitation(id);
    } catch (e: any) {
      set({ invitations: prev, error: e?.message || 'Ошибка отклонения приглашения' });
    }
  },

  fetchInvitations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await invitationsApi.fetchInvitations('pending');
      set({ invitations: res.invitations, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Ошибка загрузки приглашений' });
    }
  },
}));
