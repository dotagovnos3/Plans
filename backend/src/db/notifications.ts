import { query } from './pool.js';

// Single source of truth for notification types on the backend.
// Adding a new value here:
//   1. Adds it to `NotificationType` (compile-time check on every callsite).
//   2. Auto-extends the `notification_type` Postgres enum on next `db:migrate`
//      (see `ENUM_ADDITIONS` in `db/migrate.ts`, which is derived from this list).
// Don't forget to mirror in:
//   - contracts/mvp/db/001_init.sql            (DDL ENUM)
//   - contracts/mvp/api/openapi.yaml           (Notification.type)
//   - docs/backend-contract.md                 (DDL block)
//   - fest-app/src/types/index.ts              (NotificationType union)
//   - fest-app/src/screens/NotificationsScreen.tsx
//                                              (TYPE_LABELS, TYPE_ICONS, TYPE_ACCENT,
//                                               and tap routing if applicable)
//   - AGENTS.md, docs/CURRENT_STATUS.md        (documented count + list)
export const NOTIFICATION_TYPES = [
  'plan_invite',
  'group_invite',
  'proposal_created',
  'plan_finalized',
  'plan_unfinalized',
  'event_time_changed',
  'event_cancelled',
  'plan_reminder',
  'plan_completed',
  'friend_request',
  'friend_accepted',
  'plan_join_via_link',
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

let _emit: ((channel: string, event: string, payload: object) => void) | null = null;

export function setEmitter(emit: (channel: string, event: string, payload: object) => void) {
  _emit = emit;
}

type QueryFn = { (sql: string, params?: any[]): Promise<{ rows: any[] }> };

export async function insertNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
  q?: QueryFn
) {
  const run = q || query;
  const row = (await run(
    "INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3) RETURNING id, created_at",
    [userId, type, JSON.stringify(payload)]
  )).rows[0];
  if (_emit) {
    _emit(`user:${userId}`, 'notification.created', {
      notificationId: row.id,
      type,
      payload,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    });
  }
}
