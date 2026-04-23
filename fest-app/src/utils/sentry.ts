// Thin wrapper around @sentry/react-native so the app compiles + runs
// even if the DSN isn't configured, and so product code doesn't import
// the Sentry SDK directly.
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  try {
    Sentry.init({
      dsn,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.1,
    });
    initialized = true;
  } catch {
    // Fail silently — analytics/observability must never crash the app.
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  try {
    if (context) {
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) scope.setExtra(k, v);
        Sentry.captureException(err);
      });
    } else {
      Sentry.captureException(err);
    }
  } catch {
    // ignore
  }
}

export function setSentryUser(id: string | null) {
  if (!initialized) return;
  try {
    Sentry.setUser(id ? { id } : null);
  } catch {
    // ignore
  }
}
