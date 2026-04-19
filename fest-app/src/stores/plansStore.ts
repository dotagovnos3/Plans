import { create } from 'zustand';
import type { Plan, PlanProposal, Vote, PlanParticipant, ParticipantStatus, PlanLifecycle } from '../types';
import { mockPlans, mockMessages } from '../mocks';
import type { Message } from '../types';

interface PlansState {
  plans: Plan[];
  messages: Record<string, Message[]>;
  addPlan: (plan: Plan) => void;
  updatePlanState: (planId: string, state: PlanLifecycle) => void;
  finalizePlan: (planId: string, placeProposalId?: string, timeProposalId?: string) => void;
  unfinalizePlan: (planId: string) => void;
  cancelPlan: (planId: string) => void;
  completePlan: (planId: string) => void;
  updateParticipantStatus: (planId: string, userId: string, status: ParticipantStatus) => void;
  addProposal: (planId: string, proposal: PlanProposal) => void;
  vote: (planId: string, proposalId: string, userId: string) => void;
  unvote: (planId: string, proposalId: string, userId: string) => void;
  addMessage: (planId: string, message: Message) => void;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: mockPlans,
  messages: mockMessages,
  addPlan: (plan) => set((s) => ({ plans: [plan, ...s.plans] })),
  updatePlanState: (planId, state) => set((s) => ({
    plans: s.plans.map((p) => p.id === planId ? { ...p, lifecycle_state: state } : p),
  })),
  finalizePlan: (planId, placeProposalId, timeProposalId) => set((s) => ({
    plans: s.plans.map((p) => {
      if (p.id !== planId) return p;
      let updated = { ...p, lifecycle_state: 'finalized' as PlanLifecycle };
      if (placeProposalId && p.proposals) {
        const prop = p.proposals.find((pr) => pr.id === placeProposalId);
        if (prop) updated = { ...updated, place_status: 'confirmed', confirmed_place_text: prop.value_text, confirmed_place_lat: prop.value_lat, confirmed_place_lng: prop.value_lng };
      }
      if (timeProposalId && p.proposals) {
        const prop = p.proposals.find((pr) => pr.id === timeProposalId);
        if (prop) updated = { ...updated, time_status: 'confirmed', confirmed_time: prop.value_datetime };
      }
      return updated;
    }),
  })),
  unfinalizePlan: (planId) => set((s) => ({
    plans: s.plans.map((p) => p.id === planId ? { ...p, lifecycle_state: 'active' } : p),
  })),
  cancelPlan: (planId) => set((s) => ({
    plans: s.plans.map((p) => p.id === planId ? { ...p, lifecycle_state: 'cancelled' } : p),
  })),
  completePlan: (planId) => set((s) => ({
    plans: s.plans.map((p) => p.id === planId ? { ...p, lifecycle_state: 'completed' } : p),
  })),
  updateParticipantStatus: (planId, userId, status) => set((s) => ({
    plans: s.plans.map((p) => p.id !== planId ? p : {
      ...p,
      participants: p.participants?.map((pp) => pp.user_id === userId ? { ...pp, status } : pp),
    }),
  })),
  addProposal: (planId, proposal) => set((s) => ({
    plans: s.plans.map((p) => p.id !== planId ? p : {
      ...p,
      proposals: [...(p.proposals || []), proposal],
      place_status: proposal.type === 'place' && p.place_status === 'undecided' ? 'proposed' : p.place_status,
      time_status: proposal.type === 'time' && p.time_status === 'undecided' ? 'proposed' : p.time_status,
    }),
  })),
  vote: (planId, proposalId, userId) => set((s) => ({
    plans: s.plans.map((p) => p.id !== planId ? p : {
      ...p,
      proposals: p.proposals?.map((pr) => pr.id !== proposalId ? pr : {
        ...pr,
        votes: [...(pr.votes || []), { id: `vote-${Date.now()}`, proposal_id: proposalId, voter_id: userId, created_at: new Date().toISOString() }],
      }),
    }),
  })),
  unvote: (planId, proposalId, userId) => set((s) => ({
    plans: s.plans.map((p) => p.id !== planId ? p : {
      ...p,
      proposals: p.proposals?.map((pr) => pr.id !== proposalId ? pr : {
        ...pr,
        votes: (pr.votes || []).filter((v) => !(v.proposal_id === proposalId && v.voter_id === userId)),
      }),
    }),
  })),
  addMessage: (planId, message) => set((s) => ({
    messages: { ...s.messages, [planId]: [...(s.messages[planId] || []), message] },
  })),
}));
