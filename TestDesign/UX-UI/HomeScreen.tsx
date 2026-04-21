import React from 'react';
import { View, FlatList, TouchableOpacity, Text, Image, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { formatDateShort } from '../utils/dates';
import { CATEGORY_CHIPS } from '../utils/constants';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, AnimatedChip, GlassCard, PressableScale, Pulse } from '../components/Animations';
import type { HomeStackParamList, RootStackParamList } from '../navigation/types';
import type { Event, EventCategory } from '../types';

type NavType = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen = () => {
  const { events, interestedIds, savedIds, categoryFilter, toggleInterest, toggleSave, setCategoryFilter, fetchEvents } = useEventsStore();
  const navigation = useNavigation<NavType>();
  const unread = useNotificationsStore((s) => s.unreadCount);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => { fetchEvents(); }, []);

  const filtered = categoryFilter ? events.filter((e) => e.category === categoryFilter) : events;

  const formatSocialProof = (event: Event) => {
    if (!event.friendsInterested?.length && !(event.friendsPlanCount ?? 0)) return null;
    if ((event.friendsPlanCount ?? 0) > 0) return `У ${event.friendsInterested?.[0]?.name ?? 'друга'} уже есть план`;
    const names = event.friendsInterested!.map((f) => f.name);
    if (names.length === 1) return `${names[0]} интересуется`;
    return `${names[0]} и ещё ${names.length - 1} интересуются`;
  };

  const renderItem = ({ item, index }: { item: Event; index: number }) => {
    const isInterested = interestedIds.has(item.id);
    const isSaved = savedIds.has(item.id);
    const proof = formatSocialProof(item);

    return (
      <FadeIn delay={index * theme.anim.timing.stagger}>
        <GlassCard animated={false}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.cover_image_url }} style={s.cover} />
            <View style={s.cardBody}>
              <Text style={s.cardDate}>{formatDateShort(item.starts_at)}</Text>
              <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
              <View style={s.venueRow}>
                <Ionicons name="location" size={12} color={theme.colors.textSecondary} />
                <Text style={s.cardVenue}>{item.venue?.name}</Text>
              </View>
              {proof && (
                <View style={s.proofRow}>
                  <Ionicons name="people" size={12} color={theme.colors.primary} />
                  <Text style={s.socialProof}>{proof}</Text>
                </View>
              )}
              <View style={s.actions}>
                <PressableScale onPress={() => toggleInterest(item.id)}>
                  <View style={[s.interestBtn, isInterested && s.interestActive]}>
                    <Ionicons name={isInterested ? 'heart' : 'heart-outline'} size={14} color={isInterested ? theme.colors.accent : theme.colors.textSecondary} />
                    <Text style={[s.interestText, isInterested && s.interestTextActive]}>интересно</Text>
                  </View>
                </PressableScale>
                <PressableScale onPress={() => toggleSave(item.id)}>
                  <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? theme.colors.cta : theme.colors.textTertiary} />
                </PressableScale>
                <PressableScale onPress={() => navigation.navigate('CreatePlanFromEvent', { eventId: item.id })}>
                  <View style={s.planBtn}>
                    <Ionicons name="calendar-outline" size={14} color="#fff" />
                    <Text style={s.planBtnText}>Планы?</Text>
                  </View>
                </PressableScale>
              </View>
            </View>
          </TouchableOpacity>
        </GlassCard>
      </FadeIn>
    );
  };

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <FadeIn>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.headerTitle}>Планы?</Text>
              <View style={s.headerDot} />
            </View>
            <Pulse active={unread > 0}>
              <TouchableOpacity style={s.bell} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={22} color={theme.colors.textPrimary} />
                {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread}</Text></View>}
              </TouchableOpacity>
            </Pulse>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={s.chipsRow}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORY_CHIPS}
              keyExtractor={(c) => String(c.key ?? 'all')}
              renderItem={({ item: chip }) => (
                <AnimatedChip
                  label={chip.label}
                  active={categoryFilter === chip.key}
                  onPress={() => setCategoryFilter(chip.key)}
                />
              )}
            />
          </View>
        </FadeIn>

        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState text="Нет мероприятий" />}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        />
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.md, ...Platform.select({ web: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm } }) },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { ...theme.typography.h1, color: theme.colors.primary, fontSize: 32 },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent, marginLeft: theme.spacing.sm, marginTop: -4 },
  bell: { position: 'relative', padding: theme.spacing.sm, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.background },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chipsRow: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.md },
  cover: { width: '100%', height: Platform.select({ web: 140, default: 180 }), aspectRatio: Platform.select({ web: 16 / 7, default: undefined }), borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg },
  cardBody: { padding: theme.spacing.lg, ...Platform.select({ web: { padding: theme.spacing.md } }) },
  cardDate: { ...theme.typography.small, color: theme.colors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: theme.spacing.xs },
  cardTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs, lineHeight: 22 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: theme.spacing.xs },
  cardVenue: { ...theme.typography.caption, color: theme.colors.textSecondary },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: theme.spacing.sm },
  socialProof: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  interestBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  interestActive: { backgroundColor: theme.colors.accent + '18', borderColor: theme.colors.accent },
  interestText: { ...theme.typography.small, color: theme.colors.textSecondary },
  interestTextActive: { color: theme.colors.accent, fontWeight: '600' },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, marginLeft: 'auto', ...theme.shadows.glow },
  planBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 13 },
});
