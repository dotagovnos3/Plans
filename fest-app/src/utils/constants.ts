import type { EventCategory } from '../types';

export const CATEGORY_CHIPS: { key: EventCategory | null; label: string }[] = [
  { key: null, label: 'Все' },
  { key: 'music', label: 'Музыка' },
  { key: 'exhibition', label: 'Выставки' },
  { key: 'sport', label: 'Спорт' },
  { key: 'party', label: 'Вечеринки' },
  { key: 'food', label: 'Еда' },
  { key: 'theatre', label: 'Театр' },
  { key: 'workshop', label: 'Мастер-класс' },
];

export const CATEGORY_LABELS: Record<EventCategory | string, string> = {
  music: 'Музыка',
  theatre: 'Театр',
  exhibition: 'Выставка',
  sport: 'Спорт',
  food: 'Еда',
  party: 'Вечеринка',
  workshop: 'Мастер-класс',
  other: 'Другое',
};

export const DISTRICTS = ['Все', 'Центр', 'Север', 'Юг', 'Запад', 'Восток'];
