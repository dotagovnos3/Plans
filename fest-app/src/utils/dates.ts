const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateShort(iso: string | null | undefined): string {
  const d = safeDate(iso);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateFull(iso: string | null | undefined): string {
  const d = safeDate(iso);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatTimeAgo(iso: string | null | undefined): string {
  const d = safeDate(iso);
  if (!d) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч. назад`;
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}
