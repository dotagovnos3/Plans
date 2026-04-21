import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export const EmptyState = ({ text }: { text: string }) => (
  <View style={s.empty}>
    <View style={s.iconCircle}>
      <Ionicons name="mail-open-outline" size={24} color={theme.colors.primaryLight} />
    </View>
    <Text style={s.text}>{text}</Text>
  </View>
);

const s = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingHorizontal: theme.spacing.xl, ...Platform.select({ web: { paddingTop: 24 } }) },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  text: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center' },
});
