import { create } from 'zustand';
import type { Event, EventCategory } from '../types';
import * as eventsApi from '../api/events';

const PAGE_SIZE = 20;

interface EventsState {
  events: Event[];
  interestedIds: Set<string>;
  savedIds: Set<string>;
  categoryFilter: EventCategory | null;
  loading: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  total: number;
  error: string | null;
  clearError: () => void;
  toggleInterest: (eventId: string) => void;
  toggleSave: (eventId: string) => void;
  setCategoryFilter: (cat: EventCategory | null) => void;
  fetchEvents: () => Promise<void>;
  fetchMoreEvents: () => Promise<void>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  interestedIds: new Set<string>(),
  savedIds: new Set<string>(),
  categoryFilter: null,
  loading: false,
  loadingMore: false,
  page: 1,
  hasMore: false,
  total: 0,
  error: null,

  clearError: () => set({ error: null }),

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const cat = get().categoryFilter;
      const res = await eventsApi.fetchEvents({ category: cat ?? undefined, limit: PAGE_SIZE, page: 1 });
      const events = res.events;
      const total = res.total ?? events.length;
      const interestedIds = new Set<string>();
      const savedIds = new Set<string>();
      set({
        events,
        interestedIds,
        savedIds,
        loading: false,
        page: 1,
        hasMore: events.length < total,
        total,
      });
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Ошибка загрузки событий' });
    }
  },

  fetchMoreEvents: async () => {
    const { loading, loadingMore, hasMore, page, categoryFilter, events } = get();
    if (loading || loadingMore || !hasMore) return;
    set({ loadingMore: true });
    const nextPage = page + 1;
    try {
      const res = await eventsApi.fetchEvents({
        category: categoryFilter ?? undefined,
        limit: PAGE_SIZE,
        page: nextPage,
      });
      const incoming = res.events;
      const total = res.total ?? events.length + incoming.length;
      const knownIds = new Set(events.map((e) => e.id));
      const merged = [...events, ...incoming.filter((e) => !knownIds.has(e.id))];
      set({
        events: merged,
        page: nextPage,
        hasMore: merged.length < total,
        total,
        loadingMore: false,
      });
    } catch (e: any) {
      // Don't blow away the existing list — let the user retry by
      // reaching the end again. Surface the error in `error` so the
      // banner / toast can pick it up.
      set({ loadingMore: false, error: e?.message || 'Ошибка загрузки событий' });
    }
  },

  toggleInterest: (eventId) => {
    const { interestedIds } = get();
    const wasInterested = interestedIds.has(eventId);
    const next = new Set(interestedIds);
    if (wasInterested) { next.delete(eventId); } else { next.add(eventId); }
    set({ interestedIds: next });
    const rollback = new Set(next);
    if (wasInterested) { rollback.add(eventId); } else { rollback.delete(eventId); }
    (wasInterested ? eventsApi.removeInterest(eventId) : eventsApi.markInterest(eventId)).catch(() => set({ interestedIds: rollback }));
  },

  toggleSave: (eventId) => {
    const { savedIds } = get();
    const wasSaved = savedIds.has(eventId);
    const next = new Set(savedIds);
    if (wasSaved) { next.delete(eventId); } else { next.add(eventId); }
    set({ savedIds: next });
    const rollback = new Set(next);
    if (wasSaved) { rollback.add(eventId); } else { rollback.delete(eventId); }
    (wasSaved ? eventsApi.unsaveEvent(eventId) : eventsApi.saveEvent(eventId)).catch(() => set({ savedIds: rollback }));
  },

  setCategoryFilter: (cat) => {
    set({ categoryFilter: cat });
    get().fetchEvents();
  },
}));
