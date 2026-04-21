import { Platform } from 'react-native';

const colors = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryGlow: '#7C3AED33',

  accent: '#EC4899',
  accentLight: '#F9A8D4',
  accentDark: '#BE185D',

  cta: '#F59E0B',
  ctaLight: '#FCD34D',
  ctaDark: '#D97706',

  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EEFF',

  glassBg: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.35)',
  glassShadow: 'rgba(124,58,237,0.08)',

  textPrimary: '#1E1B4B',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E9E5F5',
  borderLight: '#F3EEFF',

  going: '#10B981',
  thinking: '#F59E0B',
  cant: '#EF4444',
  invited: '#3B82F6',

  shadow: 'rgba(30,27,75,0.08)',
  overlay: 'rgba(30,27,75,0.5)',

  gradientStart: '#7C3AED',
  gradientEnd: '#EC4899',
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
} as const;

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

const shadows = {
  sm: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

const glass = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    shadowColor: 'rgba(124,58,237,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  surface: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
  },
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
} as const;

const anim = {
  spring: { damping: 15, stiffness: 150, mass: 0.8 },
  springGentle: { damping: 20, stiffness: 100, mass: 1 },
  springBouncy: { damping: 12, stiffness: 180, mass: 0.6 },
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
    entrance: 350,
    stagger: 60,
  },
  scale: {
    pressIn: 0.96,
    pressOut: 1,
    hover: 1.02,
    appear: 1.05,
  },
} as const;

const webSpacing = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  xxxl: 30,
} as const;

const ws = Platform.OS === 'web' ? webSpacing : spacing;

export const theme = {
  colors,
  spacing: ws,
  mobileSpacing: spacing,
  webSpacing,
  typography,
  borderRadius,
  shadows,
  glass,
  anim,
  Platform,
} as const;

export type Theme = typeof theme;
