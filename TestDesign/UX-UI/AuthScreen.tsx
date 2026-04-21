import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, PressableScale } from '../components/Animations';

export const AuthScreen = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp } = useAuthStore();

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(titleScale, {
        toValue: 1,
        damping: 12,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSendOtp = () => {
    if (phone.length >= 10) { sendOtp(phone); setOtpSent(true); }
  };

  const handleVerify = () => {
    if (code.length >= 4) { verifyOtp(code); }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.bgCircle1} />
        <View style={s.bgCircle2} />

        <Animated.View style={{ opacity: titleOpacity, transform: [{ scale: titleScale }] }}>
          <View style={s.logoContainer}>
            <View style={s.logoCircle}>
              <Ionicons name="calendar" size={32} color={theme.colors.textInverse} />
            </View>
            <Text style={s.title}>Планы?</Text>
          </View>
        </Animated.View>

        <FadeIn delay={300}>
          <Text style={s.subtitle}>Вход в аккаунт</Text>
        </FadeIn>

        {!otpSent ? (
          <FadeIn delay={400}>
            <View style={s.inputGroup}>
              <Ionicons name="call-outline" size={18} color={theme.colors.textTertiary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="+7 (999) 123-45-67"
                placeholderTextColor={theme.colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            <PressableScale onPress={handleSendOtp}>
              <View style={s.button}>
                <Text style={s.buttonText}>Получить код</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </PressableScale>
          </FadeIn>
        ) : (
          <FadeIn delay={200}>
            <View style={s.inputGroup}>
              <Ionicons name="key-outline" size={18} color={theme.colors.textTertiary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Код из SMS"
                placeholderTextColor={theme.colors.textTertiary}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoFocus
              />
            </View>
            <PressableScale onPress={handleVerify}>
              <View style={s.button}>
                <Text style={s.buttonText}>Войти</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </PressableScale>
          </FadeIn>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: theme.spacing.xxl, ...Platform.select({ web: { maxWidth: 400, alignSelf: 'center', width: '100%' } }) },
  bgCircle1: { position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: theme.colors.primary + '08' },
  bgCircle2: { position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: theme.colors.accent + '08' },
  logoContainer: { alignItems: 'center', marginBottom: theme.spacing.sm },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg, ...theme.shadows.glow },
  title: { ...theme.typography.h1, color: theme.colors.primary, fontSize: 36, textAlign: 'center' },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xxl, marginTop: theme.spacing.sm },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, ...theme.shadows.sm },
  inputIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, paddingVertical: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }), fontSize: 17, color: theme.colors.textPrimary },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, ...theme.shadows.glow, ...Platform.select({ web: { padding: theme.spacing.md } }) },
  buttonText: { color: theme.colors.textInverse, fontSize: 17, fontWeight: '700', ...Platform.select({ web: { fontSize: 16 } }) },
});
