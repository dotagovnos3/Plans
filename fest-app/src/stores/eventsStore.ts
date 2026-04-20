import { create } from 'zustand';
import type { Event, EventCategory } from '../types';
import * as eventsApi from '../api/events';

interface EventsState {
  events: Event[];
  interestedIds: Set<string>;
  savedIds: Set<string>;
  categoryFilter: EventCategory | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  toggleInterest: (eventId: string) => void;
  toggleSave: (eventId: string) => void;
  setCategoryFilter: (cat: EventCategory | null) => void;
  fetchEvents: () => Promise<void>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  interestedIds: new Set<string>(),
  savedIds: new Set<string>(),
  categoryFilter: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const cat = get().categoryFilter;
      const res = await eventsApi.fetchEvents({ category: cat ?? undefined, limit: 50 });
      const events = res.events;
      const interestedIds = new Set<string>();
      const savedIds = new Set<string>();
      set({ events, interestedIds, savedIds, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Ошибка загрузки событий' });
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
