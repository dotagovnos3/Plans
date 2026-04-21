import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Platform, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateShort } from '../utils/dates';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, GlassCard, PressableScale, ScaleIn } from '../components/Animations';
import { mockUsers } from '../mocks';
import type { Event, User } from '../types';

export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { events, savedIds } = useEventsStore();
  const savedEvents = events.filter((e) => savedIds.has(e.id));
  const [showSaved, setShowSaved] = React.useState(false);
  const [showFriends, setShowFriends] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(user?.name ?? '');
  const navigation = useNavigation();

  const friends = mockUsers.filter((u) => u.id !== 'me');

  const handleSaveProfile = () => { setEditing(false); };

  if (showSaved) return (
    <ScreenContainer>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => setShowSaved(false)}>
          <View style={s.backCircle}><Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} /></View>
        </TouchableOpacity>
        <Text style={s.header}>Сохранённые</Text>
        <FlatList data={savedEvents} keyExtractor={(e) => e.id} renderItem={({ item, index }) => (
          <FadeIn delay={index * theme.anim.timing.stagger}>
            <GlassCard animated={false}>
              <TouchableOpacity style={s.savedCard} onPress={() => (navigation as any).navigate('HomeTab', { screen: 'EventDetails', params: { eventId: item.id } })} activeOpacity={0.85}>
                <Image source={{ uri: item.cover_image_url }} style={s.savedImage} />
                <View style={s.savedBody}>
                  <Text style={s.savedTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={s.metaRow}>
                    <Ionicons name="location" size={11} color={theme.colors.textTertiary} />
                    <Text style={s.savedMeta}>{item.venue?.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </GlassCard>
          </FadeIn>
        )} contentContainerStyle={s.list} ListEmptyComponent={<Text style={s.emptyText}>Ничего не сохранено</Text>} showsVerticalScrollIndicator={false} />
      </View>
    </ScreenContainer>
  );

  if (showFriends) return (
    <ScreenContainer>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => setShowFriends(false)}>
          <View style={s.backCircle}><Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} /></View>
        </TouchableOpacity>
        <Text style={s.header}>Друзья</Text>
        <FlatList data={friends} keyExtractor={(u) => u.id} renderItem={({ item, index }) => (
          <FadeIn delay={index * theme.anim.timing.stagger}>
            <GlassCard animated={false}>
              <View style={s.friendRow}>
                <View style={s.friendAvatar}><Text style={s.friendLetter}>{item.name[0]}</Text></View>
                <View style={s.friendInfo}>
                  <Text style={s.friendName}>{item.name}</Text>
                  <Text style={s.friendUsername}>@{item.username}</Text>
                </View>
              </View>
            </GlassCard>
          </FadeIn>
        )} contentContainerStyle={s.list} ListEmptyComponent={<Text style={s.emptyText}>Нет друзей</Text>} showsVerticalScrollIndicator={false} />
      </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <FadeIn>
          <View style={s.avatarCircle}>
            <Text style={s.avatarLetter}>{user?.name?.[0] ?? '?'}</Text>
          </View>
        </FadeIn>

        <ScaleIn delay={100}>
          {editing ? (
            <View style={s.editRow}>
              <TextInput style={s.editInput} value={editName} onChangeText={setEditName} autoFocus />
              <PressableScale onPress={handleSaveProfile}>
                <View style={s.editSaveBtn}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              </PressableScale>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setEditName(user?.name ?? ''); setEditing(true); }}>
              <View style={s.nameRow}>
                <Text style={s.name}>{user?.name ?? 'Гость'}</Text>
                <Ionicons name="pencil" size={14} color={theme.colors.textTertiary} />
              </View>
            </TouchableOpacity>
          )}
        </ScaleIn>

        <Text style={s.username}>@{user?.username ?? ''}</Text>

        <View style={s.menu}>
          {[
            { icon: 'people', label: 'Друзья', count: friends.length, action: () => setShowFriends(true) },
            { icon: 'bookmark', label: 'Сохранённые', count: savedEvents.length, action: () => setShowSaved(true) },
            { icon: 'log-out', label: 'Выйти', count: 0, action: logout, danger: true },
          ].map((item, i) => (
            <FadeIn key={item.label} delay={200 + i * 60}>
              <PressableScale onPress={item.action}>
                <View style={[s.menuItem, item.danger && s.menuItemDanger]}>
                  <View style={[s.menuIcon, item.danger && s.menuIconDanger]}>
                    <Ionicons name={item.icon as any} size={18} color={item.danger ? theme.colors.error : theme.colors.primary} />
                  </View>
                  <Text style={[s.menuText, item.danger && s.menuTextDanger]}>{item.label}</Text>
                  {item.count > 0 && <Text style={s.menuBadge}>{item.count}</Text>}
                  {!item.danger && <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />}
                </View>
              </PressableScale>
            </FadeIn>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background, ...Platform.select({ web: { paddingTop: theme.spacing.lg } }) },
  avatarCircle: { width: Platform.select({ web: 72, default: 88 }), height: Platform.select({ web: 72, default: 88 }), borderRadius: Platform.select({ web: 36, default: 44 }), backgroundColor: theme.colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, alignSelf: 'center', marginTop: Platform.select({ web: theme.spacing.xl, default: theme.spacing.xxxl }), borderWidth: 3, borderColor: theme.colors.primary + '30' },
  avatarLetter: { fontSize: Platform.select({ web: 28, default: 34 }), fontWeight: '800', color: theme.colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  name: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xs },
  username: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', marginBottom: theme.spacing.lg },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs },
  editInput: { ...theme.typography.h3, color: theme.colors.textPrimary, borderBottomWidth: 2, borderBottomColor: theme.colors.primary, paddingBottom: 2, minWidth: 120, textAlign: 'center' },
  editSaveBtn: { backgroundColor: theme.colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  menu: { width: '100%', paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm, marginTop: theme.spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }), ...theme.shadows.sm, borderWidth: 1, borderColor: theme.colors.borderLight },
  menuItemDanger: { borderColor: theme.colors.error + '20' },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  menuIconDanger: { backgroundColor: theme.colors.error + '12' },
  menuText: { ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 },
  menuTextDanger: { color: theme.colors.error },
  menuBadge: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700', marginRight: theme.spacing.sm },
  backBtn: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.sm },
  backCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', ...theme.shadows.sm },
  header: { ...theme.typography.h2, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.sm },
  savedCard: { flexDirection: 'row' },
  savedImage: { width: Platform.select({ web: 56, default: 70 }), height: Platform.select({ web: 56, default: 70 }), borderTopLeftRadius: theme.borderRadius.lg, borderBottomLeftRadius: theme.borderRadius.lg },
  savedBody: { flex: 1, padding: theme.spacing.md, justifyContent: 'center' },
  savedTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedMeta: { ...theme.typography.caption, color: theme.colors.textTertiary },
  emptyText: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 40 },
  friendRow: { flexDirection: 'row', alignItems: 'center' },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  friendLetter: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  friendInfo: { flex: 1 },
  friendName: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 2 },
  friendUsername: { ...theme.typography.caption, color: theme.colors.textTertiary },
});
