import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { AnimatedPressable } from '../fest-animations/AnimatedPressable';
import { SpringFadeIn } from '../fest-animations/SpringFadeIn';

export const AuthScreen = () => {
  const [phoneDigits, setPhoneDigits] = useState('7');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp, loading, error, clearError } = useAuthStore();

  // Ambient blob animation (drives both hue and position)
  const ambient = useSharedValue(0);
  useEffect(() => {
    ambient.value = withRepeat(withTiming(1, { duration: 7000 }), -1, true);
  }, []);

  // Entry animation for the title
  const titleProgress = useSharedValue(0);
  useEffect(() => {
    titleProgress.value = withDelay(120, withSpring(1, { damping: 16, stiffness: 140, mass: 0.8 }));
  }, []);

  // Form slide on OTP stage change
  const formStage = useSharedValue(0);
  useEffect(() => {
    formStage.value = withSpring(otpSent ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [otpSent]);

  const blobAStyle = useAnimatedStyle(() => {
    const translateX = interpolate(ambient.value, [0, 1], [-30, 30], Extrapolation.CLAMP);
    const translateY = interpolate(ambient.value, [0, 1], [-20, 10], Extrapolation.CLAMP);
    const scale = interpolate(ambient.value, [0, 1], [1, 1.15], Extrapolation.CLAMP);
    const color = interpolateColor(
      ambient.value,
      [0, 0.5, 1],
      [theme.colors.primary, theme.colors.accent, theme.colors.primaryLight],
    );
    return { transform: [{ translateX }, { translateY }, { scale }], backgroundColor: color };
  });

  const blobBStyle = useAnimatedStyle(() => {
    const translateX = interpolate(ambient.value, [0, 1], [40, -30], Extrapolation.CLAMP);
    const translateY = interpolate(ambient.value, [0, 1], [20, -20], Extrapolation.CLAMP);
    const scale = interpolate(ambient.value, [0, 1], [1.1, 0.95], Extrapolation.CLAMP);
    const color = interpolateColor(
      ambient.value,
      [0, 0.5, 1],
      [theme.colors.accentLight, theme.colors.primaryLight, theme.colors.accent],
    );
    return { transform: [{ translateX }, { translateY }, { scale }], backgroundColor: color };
  });

  const titleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(titleProgress.value, [0, 1], [24, 0], Extrapolation.CLAMP);
    const scale = interpolate(titleProgress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP);
    return { opacity: titleProgress.value, transform: [{ translateY }, { scale }] };
  });

  const phoneCardStyle = useAnimatedStyle(() => {
    const translateX = interpolate(formStage.value, [0, 1], [0, -40], Extrapolation.CLAMP);
    const opacity = interpolate(formStage.value, [0, 0.5, 1], [1, 0, 0], Extrapolation.CLAMP);
    return { transform: [{ translateX }], opacity };
  });

  const codeCardStyle = useAnimatedStyle(() => {
    const translateX = interpolate(formStage.value, [0, 1], [40, 0], Extrapolation.CLAMP);
    const opacity = interpolate(formStage.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP);
    return { transform: [{ translateX }], opacity };
  });

  const formatPhone = (digits: string) => {
    const local = digits.slice(1, 11);
    const part1 = local.slice(0, 3);
    const part2 = local.slice(3, 6);
    const part3 = local.slice(6, 8);
    const part4 = local.slice(8, 10);

    let formatted = '+7';
    if (local.length > 0) {
      formatted += ` (${part1}`;
      if (local.length >= 3) formatted += ')';
    }
    if (local.length > 3) formatted += ` ${part2}`;
    if (local.length > 6) formatted += ` ${part3}`;
    if (local.length > 8) formatted += ` ${part4}`;
    return formatted;
  };

  const normalizePhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '7';
    let normalized = digits;
    if (normalized[0] === '8') normalized = `7${normalized.slice(1)}`;
    if (normalized[0] !== '7') normalized = `7${normalized}`;
    return normalized.slice(0, 11);
  };

  const formattedPhone = formatPhone(phoneDigits);
  const apiPhone = `+${phoneDigits}`;
  const isPhoneComplete = phoneDigits.length === 11;
  const isCodeComplete = code.length >= 4;

  const handleSendOtp = () => {
    if (loading || !isPhoneComplete) return;
    clearError();
    sendOtp(apiPhone).then(() => setOtpSent(true)).catch(() => {});
  };

  const handleVerify = () => {
    if (loading || !isCodeComplete) return;
    clearError();
    verifyOtp(code);
  };

  const handleBack = () => {
    clearError();
    setCode('');
    setOtpSent(false);
  };

  return (
    <ScreenContainer>
      <View style={s.backdrop} pointerEvents="none">
        <Animated.View style={[s.blob, s.blobA, blobAStyle]} />
        <Animated.View style={[s.blob, s.blobB, blobBStyle]} />
      </View>

      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[s.titleWrap, titleStyle]}>
          <Text style={s.title}>Планы?</Text>
          <Text style={s.titleAccent}>Давайте соберёмся</Text>
        </Animated.View>

        <SpringFadeIn delay={260} direction="up" distance={18}>
          <Text style={s.subtitle}>
            {otpSent ? `Код отправлен на ${formattedPhone}` : 'Войдите по номеру телефона'}
          </Text>
        </SpringFadeIn>

        {error ? (
          <SpringFadeIn delay={0} direction="down" distance={8}>
            <Text style={s.errorText}>{error}</Text>
          </SpringFadeIn>
        ) : null}

        <View style={s.formStage}>
          {!otpSent ? (
            <Animated.View style={[s.formCard, phoneCardStyle]}>
              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Телефон</Text>
                <TextInput
                  style={s.input}
                  placeholder="+7 (941) 223 22 22"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formattedPhone}
                  onChangeText={(value) => setPhoneDigits(normalizePhoneInput(value))}
                  keyboardType="phone-pad"
                  autoFocus
                  editable={!loading}
                />
              </View>
              <AnimatedPressable
                style={[s.primaryBtn, (!isPhoneComplete || loading) && s.primaryBtnDisabled]}
                onPress={handleSendOtp}
                disabled={loading || !isPhoneComplete}
                activeScale={0.97}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <Text style={s.primaryBtnText}>Получить код</Text>
                )}
              </AnimatedPressable>
              <Text style={s.hint}>Мы отправим SMS с кодом подтверждения</Text>
            </Animated.View>
          ) : (
            <Animated.View style={[s.formCard, codeCardStyle]}>
              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Код из SMS</Text>
                <TextInput
                  style={[s.input, s.inputOtp]}
                  placeholder="1111"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoFocus
                  editable={!loading}
                  maxLength={6}
                />
              </View>
              <AnimatedPressable
                style={[s.primaryBtn, (!isCodeComplete || loading) && s.primaryBtnDisabled]}
                onPress={handleVerify}
                disabled={loading || !isCodeComplete}
                activeScale={0.97}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <Text style={s.primaryBtnText}>Войти</Text>
                )}
              </AnimatedPressable>
              <AnimatedPressable style={s.secondaryBtn} onPress={handleBack} activeScale={0.98}>
                <Text style={s.secondaryBtnText}>Изменить номер</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 9999,
    opacity: 0.22,
  },
  blobA: {
    top: -140,
    left: -120,
  },
  blobB: {
    bottom: -160,
    right: -140,
    opacity: 0.18,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    ...Platform.select({ web: { maxWidth: 440, alignSelf: 'center', width: '100%' } }),
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: theme.colors.primaryLight + '66',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 20,
  },
  titleAccent: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.error + '18',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  formStage: {
    minHeight: 260,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.lg,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.08,
  },
  inputWrap: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.captionBold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: 17,
    color: theme.colors.textPrimary,
    ...Platform.select({ web: { padding: theme.spacing.md, outlineStyle: 'none' as unknown as undefined } }),
  },
  inputOtp: {
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 12,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    ...Platform.select({ web: { padding: theme.spacing.md } }),
  },
  primaryBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0.1,
  },
  primaryBtnText: {
    color: theme.colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    ...Platform.select({ web: { fontSize: 16 } }),
  },
  secondaryBtn: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  secondaryBtnText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  hint: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
