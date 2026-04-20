import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { useFriendsStore } from '../stores/friendsStore';
import { useEventsStore } from '../stores/eventsStore';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';


export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { events, savedIds } = useEventsStore();
  const { friends, loading: friendsLoading, error: friendsError, fetchFriends } = useFriendsStore();
  const savedEvents = events.filter((e) => savedIds.has(e.id));
  const [showSaved, setShowSaved] = React.useState(false);
  const [showFriends, setShowFriends] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(user?.name ?? '');
  const navigation = useNavigation();

  React.useEffect(() => { fetchFriends(); }, []);

  const handleSaveProfile = () => {
    setEditing(false);
  };

  if (showSaved) return (
    <ScreenContainer>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => setShowSaved(false)}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.header}>Сохранённые</Text>
        <FlatList data={savedEvents} keyExtractor={(e) => e.id} renderItem={({ item }) => (
          <TouchableOpacity style={s.savedCard} onPress={() => (navigation as any).navigate('HomeTab', { screen: 'EventDetails', params: { eventId: item.id } })} activeOpacity={0.7}>
            <Image source={{ uri: item.cover_image_url }} style={s.savedImage} />
            <View style={s.savedBody}>
              <Text style={s.savedTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.savedMeta}>{item.venue?.name}</Text>
            </View>
          </TouchableOpacity>
        )} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Ничего не сохранено" />} />
      </View>
    </ScreenContainer>
  );

  if (showFriends) return (
    <ScreenContainer>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => setShowFriends(false)}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.header}>Друзья</Text>
        {friendsError && <Text style={s.errorBanner}>{friendsError}</Text>}
        {friendsLoading ? <ActivityIndicator size="large" color={theme.colors.primary} style={s.loader} /> : (
        <FlatList data={friends} keyExtractor={(u) => u.id} renderItem={({ item }) => (
          <View style={s.friendRow}>
            <View style={s.friendAvatar}><Text style={s.friendLetter}>{item.name[0]}</Text></View>
            <View style={s.friendInfo}>
              <Text style={s.friendName}>{item.name}</Text>
              <Text style={s.friendUsername}>@{item.username}</Text>
            </View>
          </View>
        )} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Нет друзей" />} />
        )}
      </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarLetter}>{user?.name?.[0] ?? '?'}</Text>
        </View>
        {editing ? (
          <View style={s.editRow}>
            <TextInput style={s.editInput} value={editName} onChangeText={setEditName} autoFocus />
            <TouchableOpacity style={s.editSaveBtn} onPress={handleSaveProfile}>
              <Text style={s.editSaveBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => { setEditName(user?.name ?? ''); setEditing(true); }}>
            <Text style={s.name}>{user?.name ?? 'Гость'} ✎</Text>
          </TouchableOpacity>
        )}
        <Text style={s.username}>@{user?.username ?? ''}</Text>

        <View style={s.menu}>
          <TouchableOpacity style={s.menuItem} onPress={() => setShowFriends(true)}>
            <View style={s.menuRow}>
              <Text style={s.menuText}>Друзья</Text>
              <Text style={s.menuBadge}>{friends.length}</Text>
            </View>
          </TouchableOpacity>
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

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background, ...Platform.select({ web: { paddingTop: theme.spacing.lg } }) },
  avatarCircle: { width: Platform.select({ web: 64, default: 80 }), height: Platform.select({ web: 64, default: 80 }), borderRadius: Platform.select({ web: 32, default: 40 }), backgroundColor: theme.colors.primaryLight + '33', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, alignSelf: 'center', marginTop: Platform.select({ web: theme.spacing.xl, default: theme.spacing.xxxl }) },
  avatarLetter: { fontSize: Platform.select({ web: 26, default: 32 }), fontWeight: '700', color: theme.colors.primary },
  name: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xs },
  username: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', marginBottom: theme.spacing.lg },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs },
  editInput: { ...theme.typography.h3, color: theme.colors.textPrimary, borderBottomWidth: 1, borderBottomColor: theme.colors.primary, paddingBottom: 2, minWidth: 120, textAlign: 'center' },
  editSaveBtn: { backgroundColor: theme.colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  editSaveBtnText: { color: theme.colors.textInverse, fontSize: 16, fontWeight: '700' },
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
  friendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryLight + '33', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  friendLetter: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  friendInfo: { flex: 1 },
  friendName: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 2 },
  friendUsername: { ...theme.typography.caption, color: theme.colors.textTertiary },
  loader: { marginTop: 40 },
  errorBanner: { ...theme.typography.caption, color: theme.colors.error, textAlign: 'center', padding: theme.spacing.sm, backgroundColor: theme.colors.error + '11', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
});
