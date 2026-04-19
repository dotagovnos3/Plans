import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Platform } from 'react-native';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateShort } from '../utils/dates';
import { ScreenContainer } from '../components/ScreenContainer';
import type { Event } from '../types';

export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { events, savedIds } = useEventsStore();
  const savedEvents = events.filter((e) => savedIds.has(e.id));
  const [showSaved, setShowSaved] = React.useState(false);

  if (showSaved) return (
    <ScreenContainer>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => setShowSaved(false)}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.header}>Сохранённые</Text>
        <FlatList data={savedEvents} keyExtractor={(e) => e.id} renderItem={({ item }) => <SavedEventCard event={item} />} contentContainerStyle={s.list} ListEmptyComponent={<Text style={s.emptyText}>Ничего не сохранено</Text>} />
      </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarLetter}>{user?.name?.[0] ?? '?'}</Text>
        </View>
        <Text style={s.name}>{user?.name ?? 'Гость'}</Text>
        <Text style={s.username}>@{user?.username ?? ''}</Text>

        <View style={s.menu}>
          <TouchableOpacity style={s.menuItem} onPress={() => setShowSaved(true)}>
            <View style={s.menuRow}>
              <Text style={s.menuText}>Сохранённые</Text>
              {savedEvents.length > 0 && <Text style={s.menuBadge}>{savedEvents.length}</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={logout}>
            <Text style={[s.menuText, { color: theme.colors.error }]}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const SavedEventCard = ({ event }: { event: Event }) => (
  <View style={s.savedCard}>
    <Image source={{ uri: event.cover_image_url }} style={s.savedImage} />
    <View style={s.savedBody}>
      <Text style={s.savedTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={s.savedMeta}>{event.venue?.name}</Text>
    </View>
  </View>
);

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background, ...Platform.select({ web: { paddingTop: theme.spacing.lg } }) },
  avatarCircle: { width: Platform.select({ web: 64, default: 80 }), height: Platform.select({ web: 64, default: 80 }), borderRadius: Platform.select({ web: 32, default: 40 }), backgroundColor: theme.colors.primaryLight + '33', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, alignSelf: 'center', marginTop: Platform.select({ web: theme.spacing.xl, default: theme.spacing.xxxl }) },
  avatarLetter: { fontSize: Platform.select({ web: 26, default: 32 }), fontWeight: '700', color: theme.colors.primary },
  name: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xs },
  username: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', marginBottom: theme.spacing.lg },
  menu: { width: '100%', paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm },
  menuItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }), ...theme.shadows.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuText: { ...theme.typography.body, color: theme.colors.textPrimary },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  menuBadge: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700' },
  backBtn: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.sm },
  backText: { ...theme.typography.body, color: theme.colors.primary },
  header: { ...theme.typography.h2, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  savedCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm, overflow: 'hidden', ...theme.shadows.sm },
  savedImage: { width: Platform.select({ web: 56, default: 70 }), height: Platform.select({ web: 56, default: 70 }) },
  savedBody: { flex: 1, padding: theme.spacing.md, justifyContent: 'center' },
  savedTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 2 },
  savedMeta: { ...theme.typography.caption, color: theme.colors.textTertiary },
  emptyText: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 40 },
});
