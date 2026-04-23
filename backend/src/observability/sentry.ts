import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    // Keep tracesSampleRate conservative — beta-diagnostic use only.
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  if (context) Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) scope.setExtra(k, v);
    Sentry.captureException(err);
  });
  else Sentry.captureException(err);
}

export { Sentry };
