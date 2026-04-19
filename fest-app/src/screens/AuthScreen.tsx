import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { ScreenContainer } from '../components/ScreenContainer';

export const AuthScreen = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp } = useAuthStore();

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      sendOtp(phone);
      setOtpSent(true);
    }
  };

  const handleVerify = () => {
    if (code.length >= 4) {
      verifyOtp(code);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={s.title}>Планы?</Text>
        <Text style={s.subtitle}>Вход в аккаунт</Text>

        {!otpSent ? (
          <>
            <TextInput
              style={s.input}
              placeholder="+7 (999) 123-45-67"
              placeholderTextColor={theme.colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <TouchableOpacity style={s.button} onPress={handleSendOtp}>
              <Text style={s.buttonText}>Получить код</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={s.input}
              placeholder="Код из SMS"
              placeholderTextColor={theme.colors.textTertiary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity style={s.button} onPress={handleVerify}>
              <Text style={s.buttonText}>Войти</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: theme.spacing.xxl, ...Platform.select({ web: { maxWidth: 400, alignSelf: 'center', width: '100%' } }) },
  title: { ...theme.typography.h1, color: theme.colors.primary, textAlign: 'center', marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xxl },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, fontSize: 17, marginBottom: theme.spacing.lg, color: theme.colors.textPrimary, ...Platform.select({ web: { padding: theme.spacing.md } }) },
  button: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, alignItems: 'center', ...Platform.select({ web: { padding: theme.spacing.md } }) },
  buttonText: { color: theme.colors.textInverse, fontSize: 17, fontWeight: '600', ...Platform.select({ web: { fontSize: 16 } }) },
});
