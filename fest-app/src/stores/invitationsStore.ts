import { create } from 'zustand';
import type { Invitation, InvitationStatus, PlanParticipant } from '../types';
import { mockInvitations } from '../mocks';
import { mockUsers } from '../mocks';
import { usePlansStore } from './plansStore';
import { useAuthStore } from './authStore';

interface InvitationsState {
  invitations: Invitation[];
  accept: (id: string) => void;
  decline: (id: string) => void;
}

export const useInvitationsStore = create<InvitationsState>((set, get) => ({
  invitations: mockInvitations,
  accept: (id) => {
    const inv = get().invitations.find((i) => i.id === id);
    if (inv && inv.type === 'plan') {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        const plansStore = usePlansStore.getState();
        const plan = plansStore.plans.find((p) => p.id === inv.target_id);
        const alreadyIn = plan?.participants?.some((p) => p.user_id === userId);
        if (!alreadyIn) {
          const newParticipant: PlanParticipant = {
            id: `pp-accept-${Date.now()}`,
            plan_id: inv.target_id,
            user_id: userId,
            status: 'going',
            joined_at: new Date().toISOString(),
            user: useAuthStore.getState().user ?? undefined,
          };
          usePlansStore.setState((s) => ({
            plans: s.plans.map((p) => p.id === inv.target_id
              ? { ...p, participants: [...(p.participants || []), newParticipant] }
              : p),
          }));
        }
      }
    }
    set((s) => ({
      invitations: s.invitations.map((i) => i.id === id ? { ...i, status: 'accepted' as InvitationStatus } : i),
    }));
  },
  decline: (id) => set((s) => ({
    invitations: s.invitations.map((i) => i.id === id ? { ...i, status: 'declined' as InvitationStatus } : i),
  })),
}));
