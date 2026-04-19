import { create } from 'zustand';
import type { User } from '../types';
import { mockUsers } from '../mocks';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  otpSent: boolean;
  phone: string;
  sendOtp: (phone: string) => void;
  verifyOtp: (code: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  otpSent: false,
  phone: '',
  sendOtp: (phone) => set({ phone, otpSent: true }),
  verifyOtp: (_code) => set({ user: mockUsers[5], isAuthenticated: true, otpSent: false }),
  logout: () => set({ user: null, isAuthenticated: false, otpSent: false, phone: '' }),
}));
