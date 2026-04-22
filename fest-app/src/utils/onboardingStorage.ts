// Persistent one-time flag for the onboarding gate.
//
// Unlike `pendingJoin` (which only needs to survive the OTP render cycle),
// this flag MUST survive app kills on native — otherwise the user re-sees
// the onboarding carousel every cold-start. So the strategy is:
//
// - Web: `localStorage` (synchronous, persistent across reloads).
// - Native (iOS / Android): `AsyncStorage` (persistent across app kills).
// - In-memory mirror in both cases so the very first-session check after
//   `markOnboardingComplete` is instant without needing to re-read storage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'fest_onboarding_completed_v1';
let inMemoryDone: boolean | null = null;

const hasLocalStorage = () =>
  Platform.OS === 'web' && typeof localStorage !== 'undefined';

export async function isOnboardingComplete(): Promise<boolean> {
  if (inMemoryDone !== null) return inMemoryDone;
  try {
    if (hasLocalStorage()) {
      inMemoryDone = localStorage.getItem(KEY) === '1';
      return inMemoryDone;
    }
    const v = await AsyncStorage.getItem(KEY);
    inMemoryDone = v === '1';
    return inMemoryDone;
  } catch {
    // If storage blows up for any reason, fail open — treat as "done"
    // to avoid trapping the user on the onboarding screen every launch.
    inMemoryDone = true;
    return true;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  inMemoryDone = true;
  try {
    if (hasLocalStorage()) {
      localStorage.setItem(KEY, '1');
      return;
    }
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Best-effort — the in-memory flag still prevents re-showing in this session.
  }
}
