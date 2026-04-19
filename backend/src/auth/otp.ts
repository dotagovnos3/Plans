const otpStore = new Map<string, { code: string; expiresAt: number }>();

const OTP_CODE = process.env.OTP_CODE || '1111';
const OTP_TTL_MS = 5 * 60 * 1000;

export function sendOtp(phone: string): boolean {
  otpStore.set(phone, { code: OTP_CODE, expiresAt: Date.now() + OTP_TTL_MS });
  return true;
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}
