// Thin PostHog wrapper used by route handlers to track core-loop events.
//
// No-op when POSTHOG_KEY is not set, so the backend works offline / in tests
// without extra plumbing. All calls are fire-and-forget — failures in the
// analytics pipeline must never affect request handling.
import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

export function initAnalytics() {
  const key = process.env.POSTHOG_KEY;
  if (!key) return;
  const host = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com';
  client = new PostHog(key, { host, flushAt: 10, flushInterval: 10_000 });
}

export function track(distinctId: string, event: string, properties?: Record<string, unknown>) {
  if (!client || !distinctId) return;
  try {
    client.capture({ distinctId, event, properties });
  } catch {
    // never let analytics break a request
  }
}

export async function shutdownAnalytics() {
  if (!client) return;
  try {
    await client.shutdown();
  } catch {
    // ignore
  }
}
