import { create } from 'zustand';
import type { Event, EventCategory } from '../types';
import { mockEvents } from '../mocks';

interface EventsState {
  events: Event[];
  interestedIds: Set<string>;
  savedIds: Set<string>;
  categoryFilter: EventCategory | null;
  toggleInterest: (eventId: string) => void;
  toggleSave: (eventId: string) => void;
  setCategoryFilter: (cat: EventCategory | null) => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: mockEvents,
  interestedIds: new Set<string>(),
  savedIds: new Set<string>(),
  categoryFilter: null,
  toggleInterest: (eventId) => {
    const next = new Set(get().interestedIds);
    if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
    set({ interestedIds: next });
  },
  toggleSave: (eventId) => {
    const next = new Set(get().savedIds);
    if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
    set({ savedIds: next });
  },
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
}));
