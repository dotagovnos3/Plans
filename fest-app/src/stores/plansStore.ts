import { create } from 'zustand';
import type { Plan, PlanProposal, ParticipantStatus, PlanLifecycle, Message } from '../types';
import * as plansApi from '../api/plans';

// Per-operation error keys. `error` (below) is reserved for generic
// list-loading failures (fetchMyPlans / fetchPlan). Anything that the
// user explicitly triggers — sending a message, voting, finalizing,
// inviting — must use `operationErrors[op]` so failures from one
// action don't bleed into the UI of an unrelated one.
export type PlanOp =
  | 'create'
  | 'sendMessage'
  | 'createProposal'
  | 'vote'
  | 'unvote'
  | 'finalize'
  | 'unfinalize'
  | 'repeat'
  | 'participantStatus'
  | 'removeParticipant'
  | 'inviteParticipant'
  | 'cancel'
  | 'complete'
  | 'fetchMessages'
  | 'fetchProposals';

export type PlanOperationErrors = Partial<Record<PlanOp, string>>;

// `messagesHasMore[planId]` is `false` once we've fetched a page that
// returned fewer than the page size — at that point we know we've hit
// the start of the conversation. Defaults to `true` so the very first
// scroll-up after entering a plan triggers a load.
const MESSAGES_PAGE_SIZE = 50;

interface PlansState {
  plans: Plan[];
  messages: Record<string, Message[]>;
  messagesHasMore: Record<string, boolean>;
  messagesLoadingMore: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  operationErrors: PlanOperationErrors;
  clearError: () => void;
  clearOpError: (op: PlanOp) => void;
  clearAllOpErrors: () => void;
  fetchMyPlans: () => Promise<void>;
  fetchPlan: (planId: string) => Promise<void>;
  apiCreatePlan: (data: Parameters<typeof plansApi.createPlan>[0]) => Promise<string>;
  apiUpdateParticipantStatus: (planId: string, userId: string, status: ParticipantStatus) => Promise<void>;
  apiRemoveParticipant: (planId: string, userId: string) => Promise<void>;
  apiCancelPlan: (planId: string) => Promise<void>;
  apiCompletePlan: (planId: string) => Promise<void>;
  apiFinalize: (planId: string, placeProposalId?: string, timeProposalId?: string) => Promise<void>;
  apiUnfinalize: (planId: string) => Promise<void>;
  apiCreateProposal: (planId: string, data: Parameters<typeof plansApi.createProposal>[1]) => Promise<void>;
  apiVote: (planId: string, proposalId: string) => Promise<void>;
  apiUnvote: (planId: string, proposalId: string) => Promise<void>;
  apiRepeat: (planId: string) => Promise<string | null>;
  apiFetchMessages: (planId: string, before?: string) => Promise<void>;
  apiFetchOlderMessages: (planId: string) => Promise<void>;
  apiSendMessage: (planId: string, text: string) => Promise<void>;
  apiFetchProposals: (planId: string) => Promise<void>;
  apiInviteParticipant: (planId: string, inviteeId: string) => Promise<void>;
  pushMessage: (planId: string, msg: Message) => void;
  pushProposal: (planId: string, proposal: PlanProposal) => void;
  pushVote: (planId: string, proposalId: string, voterId: string, action: 'added' | 'removed', voteId?: string, createdAt?: string) => void;
}

const upsertPlan = (plans: Plan[], updated: Plan): Plan[] =>
  plans.some((p) => p.id === updated.id)
    ? plans.map((p) => (p.id === updated.id ? updated : p))
    : [updated, ...plans];

export const usePlansStore = create<PlansState>((set, get) => {
  // Inline helpers — kept private to the store so we don't expose
  // mutators that bypass the typed PlanOp union.
  const setOpError = (op: PlanOp, msg: string) =>
    set((s) => ({ operationErrors: { ...s.operationErrors, [op]: msg } }));
  const startOp = (op: PlanOp) =>
    set((s) => {
      if (!(op in s.operationErrors)) return s;
      const next = { ...s.operationErrors };
      delete next[op];
      return { operationErrors: next };
    });

  return {
    plans: [],
    messages: {},
    messagesHasMore: {},
    messagesLoadingMore: {},
    loading: false,
    error: null,
    operationErrors: {},

    clearError: () => set({ error: null }),
    clearOpError: (op) =>
      set((s) => {
        if (!(op in s.operationErrors)) return s;
        const next = { ...s.operationErrors };
        delete next[op];
        return { operationErrors: next };
      }),
    clearAllOpErrors: () => set({ operationErrors: {} }),

    fetchMyPlans: async () => {
      set({ loading: true, error: null });
      try {
        const res = await plansApi.fetchPlans({ participant: 'me' });
        set({ plans: res.plans, loading: false });
      } catch (e: any) {
        set({ loading: false, error: e?.message || 'Ошибка загрузки планов' });
      }
    },

    fetchPlan: async (planId) => {
      set({ error: null });
      const alreadyHave = get().plans.some((p) => p.id === planId);
      if (!alreadyHave) set({ loading: true });
      try {
        const plan = await plansApi.fetchPlan(planId);
        set((s) => ({ plans: upsertPlan(s.plans, plan), loading: false }));
      } catch (e: any) {
        set({ error: e?.message || 'Ошибка загрузки плана', loading: false });
      }
    },

    apiCreatePlan: async (data) => {
      startOp('create');
      try {
        const plan = await plansApi.createPlan(data);
        set((s) => ({ plans: [plan, ...s.plans] }));
        return plan.id;
      } catch (e: any) {
        setOpError('create', e?.message || 'Ошибка создания плана');
        throw e;
      }
    },

    apiUpdateParticipantStatus: async (planId, userId, status) => {
      startOp('participantStatus');
      try {
        await plansApi.updateParticipantStatus(planId, userId, status);
      } catch (e: any) {
        setOpError('participantStatus', e?.message || 'Ошибка обновления статуса');
        return;
      }
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                participants: p.participants?.map((pp) =>
                  pp.user_id === userId ? { ...pp, status } : pp
                ),
              }
        ),
      }));
    },

    apiRemoveParticipant: async (planId, userId) => {
      startOp('removeParticipant');
      try {
        await plansApi.removeParticipant(planId, userId);
      } catch (e: any) {
        setOpError('removeParticipant', e?.message || 'Ошибка удаления участника');
        return;
      }
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                participants: (p.participants || []).filter(
                  (pp) => pp.user_id !== userId
                ),
              }
        ),
      }));
    },

    apiCancelPlan: async (planId) => {
      startOp('cancel');
      try {
        await plansApi.cancelPlan(planId);
      } catch (e: any) {
        setOpError('cancel', e?.message || 'Ошибка отмены плана');
        return;
      }
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id === planId ? { ...p, lifecycle_state: 'cancelled' as PlanLifecycle } : p
        ),
      }));
    },

    apiCompletePlan: async (planId) => {
      startOp('complete');
      try {
        await plansApi.completePlan(planId);
      } catch (e: any) {
        setOpError('complete', e?.message || 'Ошибка завершения плана');
        return;
      }
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id === planId ? { ...p, lifecycle_state: 'completed' as PlanLifecycle } : p
        ),
      }));
    },

    apiFinalize: async (planId, placeProposalId, timeProposalId) => {
      startOp('finalize');
      try {
        const res = await plansApi.finalizePlan(planId, placeProposalId, timeProposalId);
        set((s) => ({ plans: upsertPlan(s.plans, res.plan) }));
      } catch (e: any) {
        setOpError('finalize', e?.message || 'Ошибка финализации');
        throw e;
      }
    },

    apiUnfinalize: async (planId) => {
      startOp('unfinalize');
      try {
        const res = await plansApi.unfinalizePlan(planId);
        set((s) => ({ plans: upsertPlan(s.plans, res.plan) }));
      } catch (e: any) {
        setOpError('unfinalize', e?.message || 'Ошибка отмены финализации');
      }
    },

    apiCreateProposal: async (planId, data) => {
      startOp('createProposal');
      let res;
      try {
        res = await plansApi.createProposal(planId, data);
      } catch (e: any) {
        setOpError('createProposal', e?.message || 'Ошибка создания предложения');
        return;
      }
      const proposal = res.proposal;
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                proposals: [...(p.proposals || []), proposal],
                place_status:
                  proposal.type === 'place' && p.place_status === 'undecided'
                    ? 'proposed'
                    : p.place_status,
                time_status:
                  proposal.type === 'time' && p.time_status === 'undecided'
                    ? 'proposed'
                    : p.time_status,
              }
        ),
        messages: {
          ...s.messages,
          [planId]: [
            ...(s.messages[planId] || []),
            {
              id: `msg-prop-${proposal.id}`,
              context_type: 'plan',
              context_id: planId,
              sender_id: proposal.proposer_id,
              text: '',
              type: 'proposal_card' as const,
              reference_id: proposal.id,
              client_message_id: null,
              created_at: proposal.created_at,
              sender: undefined,
            },
          ],
        },
      }));
    },

    apiVote: async (planId, proposalId) => {
      startOp('vote');
      const prevPlans = get().plans;

      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                proposals: p.proposals?.map((pr) =>
                  pr.id !== proposalId
                    ? pr
                    : {
                        ...pr,
                        votes: [
                          ...(pr.votes || []),
                          {
                            id: `vote-opt-${Date.now()}`,
                            proposal_id: proposalId,
                            voter_id: '__optimistic__',
                            created_at: new Date().toISOString(),
                          },
                        ],
                      }
                ),
              }
        ),
      }));

      try {
        const res = await plansApi.voteOnProposal(planId, proposalId);
        const vote = (res as { vote: { id: string; proposal_id: string; voter_id: string; created_at: string } }).vote;
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id !== planId
              ? p
              : {
                  ...p,
                  proposals: p.proposals?.map((pr) =>
                    pr.id !== proposalId
                      ? pr
                      : {
                          ...pr,
                          votes: [
                            ...(pr.votes || []).filter(
                              (v) => v.voter_id !== '__optimistic__'
                            ),
                            vote,
                          ],
                        }
                  ),
                }
          ),
        }));
      } catch (e: any) {
        set({ plans: prevPlans });
        setOpError('vote', e?.message || 'Ошибка голосования');
      }
    },

    apiUnvote: async (planId, proposalId) => {
      startOp('unvote');
      const prevPlans = get().plans;
      const plan = prevPlans.find((p) => p.id === planId);
      const myVote = plan?.proposals
        ?.find((pr) => pr.id === proposalId)
        ?.votes?.find((v) => v.voter_id !== '__optimistic__');

      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                proposals: p.proposals?.map((pr) =>
                  pr.id !== proposalId
                    ? pr
                    : {
                        ...pr,
                        votes: (pr.votes || []).filter(
                          (v) =>
                            v.voter_id === '__optimistic__' ||
                            v.id !== myVote?.id
                        ),
                      }
                ),
              }
        ),
      }));

      try {
        await plansApi.unvoteProposal(planId, proposalId);
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id !== planId
              ? p
              : {
                  ...p,
                  proposals: p.proposals?.map((pr) =>
                    pr.id !== proposalId
                      ? pr
                      : {
                          ...pr,
                          votes: (pr.votes || []).filter(
                            (v) => v.id !== myVote?.id
                          ),
                        }
                  ),
                }
          ),
        }));
      } catch (e: any) {
        set({ plans: prevPlans });
        setOpError('unvote', e?.message || 'Ошибка отмены голоса');
      }
    },

    apiRepeat: async (planId) => {
      startOp('repeat');
      try {
        const res = await plansApi.repeatPlan(planId);
        const newPlan = res.plan;
        set((s) => ({ plans: [newPlan, ...s.plans] }));
        return newPlan.id;
      } catch (e: any) {
        setOpError('repeat', e?.message || 'Ошибка повтора плана');
        return null;
      }
    },

    apiFetchMessages: async (planId, before) => {
      startOp('fetchMessages');
      try {
        const res = await plansApi.fetchMessages(planId, before, MESSAGES_PAGE_SIZE);
        const fetched = res.messages;
        set((s) => {
          const existing = s.messages[planId] || [];
          const existingIds = new Set(existing.map((m) => m.id));
          const merged = [...existing, ...fetched.filter((m) => !existingIds.has(m.id))];
          merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
          // After the initial fetch (no `before`), record whether there
          // is more history. We assume "more" until proven otherwise.
          const hasMore = before
            ? s.messagesHasMore[planId] ?? true
            : fetched.length >= MESSAGES_PAGE_SIZE;
          return {
            messages: { ...s.messages, [planId]: merged },
            messagesHasMore: { ...s.messagesHasMore, [planId]: hasMore },
          };
        });
      } catch (e: any) {
        setOpError('fetchMessages', e?.message || 'Ошибка загрузки сообщений');
      }
    },

    apiFetchOlderMessages: async (planId) => {
      const state = get();
      if (state.messagesLoadingMore[planId]) return;
      if (state.messagesHasMore[planId] === false) return;
      const existing = state.messages[planId] || [];
      // Use the oldest non-optimistic message as the cursor; optimistic
      // entries have a `Date.now()` timestamp that is newer than any
      // server-side history, so they're never a valid cursor anyway.
      const oldest = existing.find(
        (m) => !m.id.startsWith('optimistic-') && !m.id.startsWith('msg-prop-')
      );
      if (!oldest) {
        // Nothing to anchor against (initial load probably hasn't run
        // yet) — fall back to the regular fetch.
        return get().apiFetchMessages(planId);
      }
      set((s) => ({
        messagesLoadingMore: { ...s.messagesLoadingMore, [planId]: true },
      }));
      startOp('fetchMessages');
      try {
        const res = await plansApi.fetchMessages(planId, oldest.created_at, MESSAGES_PAGE_SIZE);
        const fetched = res.messages;
        set((s) => {
          const cur = s.messages[planId] || [];
          const ids = new Set(cur.map((m) => m.id));
          const merged = [...cur, ...fetched.filter((m) => !ids.has(m.id))];
          merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
          return {
            messages: { ...s.messages, [planId]: merged },
            messagesHasMore: {
              ...s.messagesHasMore,
              [planId]: fetched.length >= MESSAGES_PAGE_SIZE,
            },
            messagesLoadingMore: { ...s.messagesLoadingMore, [planId]: false },
          };
        });
      } catch (e: any) {
        set((s) => ({
          messagesLoadingMore: { ...s.messagesLoadingMore, [planId]: false },
        }));
        setOpError('fetchMessages', e?.message || 'Ошибка загрузки сообщений');
      }
    },

    apiSendMessage: async (planId, text) => {
      startOp('sendMessage');
      const clientMessageId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMsg: Message = {
        id: `optimistic-${clientMessageId}`,
        context_type: 'plan',
        context_id: planId,
        sender_id: '__pending__',
        text,
        type: 'user',
        reference_id: null,
        client_message_id: clientMessageId,
        created_at: new Date().toISOString(),
      };
      set((s) => ({
        messages: {
          ...s.messages,
          [planId]: [...(s.messages[planId] || []), optimisticMsg],
        },
      }));
      try {
        const res = await plansApi.sendMessage(planId, text, clientMessageId);
        const msg = res.message;
        set((s) => {
          const existing = s.messages[planId] || [];
          const idx = existing.findIndex(
            (m) => m.client_message_id === clientMessageId || m.id === msg.id
          );
          if (idx >= 0) {
            const updated = [...existing];
            updated[idx] = msg;
            return { messages: { ...s.messages, [planId]: updated } };
          }
          return {
            messages: {
              ...s.messages,
              [planId]: [...existing, msg].sort((a, b) =>
                a.created_at.localeCompare(b.created_at)
              ),
            },
          };
        });
      } catch (e: any) {
        set((s) => ({
          messages: {
            ...s.messages,
            [planId]: (s.messages[planId] || []).filter(
              (m) => m.client_message_id !== clientMessageId
            ),
          },
        }));
        setOpError('sendMessage', e?.message || 'Ошибка отправки сообщения');
      }
    },

    apiFetchProposals: async (planId) => {
      startOp('fetchProposals');
      try {
        const res = await plansApi.fetchProposals(planId);
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id !== planId ? p : { ...p, proposals: res.proposals }
          ),
        }));
      } catch (e: any) {
        setOpError('fetchProposals', e?.message || 'Ошибка загрузки предложений');
      }
    },

    apiInviteParticipant: async (planId, inviteeId) => {
      startOp('inviteParticipant');
      try {
        await plansApi.inviteParticipant(planId, inviteeId);
        const plan = await plansApi.fetchPlan(planId);
        set((s) => ({ plans: upsertPlan(s.plans, plan) }));
      } catch (e: any) {
        setOpError('inviteParticipant', e?.message || 'Ошибка приглашения участника');
      }
    },

    pushMessage: (planId, msg) => {
      set((s) => {
        const existing = s.messages[planId] || [];
        if (msg.client_message_id) {
          const idx = existing.findIndex(
            (m) => m.client_message_id === msg.client_message_id
          );
          if (idx >= 0) {
            const updated = [...existing];
            updated[idx] = msg;
            return { messages: { ...s.messages, [planId]: updated } };
          }
        }
        if (existing.some((m) => m.id === msg.id)) return s;
        return {
          messages: {
            ...s.messages,
            [planId]: [...existing, msg].sort((a, b) =>
              a.created_at.localeCompare(b.created_at)
            ),
          },
        };
      });
    },

    pushProposal: (planId, proposal) => {
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : (p.proposals || []).some((pr) => pr.id === proposal.id)
              ? p
              : {
                  ...p,
                  proposals: [...(p.proposals || []), proposal],
                  place_status:
                    proposal.type === 'place' && p.place_status === 'undecided'
                      ? 'proposed'
                      : p.place_status,
                  time_status:
                    proposal.type === 'time' && p.time_status === 'undecided'
                      ? 'proposed'
                      : p.time_status,
                }
        ),
      }));
    },

    pushVote: (planId, proposalId, voterId, action, voteId, createdAt) => {
      set((s) => ({
        plans: s.plans.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                proposals: p.proposals?.map((pr) => {
                  if (pr.id !== proposalId) return pr;
                  const votes = pr.votes || [];
                  if (action === 'added') {
                    if (votes.some((v) => v.voter_id === voterId && v.voter_id !== '__optimistic__')) return pr;
                    return {
                      ...pr,
                      votes: [
                        ...votes.filter((v) => v.voter_id !== '__optimistic__'),
                        {
                          id: voteId || `vote-ws-${Date.now()}`,
                          proposal_id: proposalId,
                          voter_id: voterId,
                          created_at: createdAt || new Date().toISOString(),
                        },
                      ],
                    };
                  }
                  return {
                    ...pr,
                    votes: votes.filter((v) => v.voter_id !== voterId),
                  };
                }),
              }
        ),
      }));
    },
  };
});
