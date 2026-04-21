import React from 'react';
import { View, FlatList, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { formatDateShort } from '../utils/dates';
import { CATEGORY_CHIPS } from '../utils/constants';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList, RootStackParamList } from '../navigation/types';
import type { Event, EventCategory } from '../types';
import { AnimatedCard } from '../fest-animations/AnimatedCard';
import { AnimatedChip } from '../fest-animations/AnimatedChip';
import { AnimatedPressable } from '../fest-animations/AnimatedPressable';
import { AnimatedNotificationBell } from '../fest-animations/AnimatedNotificationBell';
import { SpringFadeIn } from '../fest-animations/SpringFadeIn';
import { Skeleton, SkeletonCard } from '../fest-animations/Skeleton';
import { AnimatedImageComponent as AnimatedImage } from '../fest-animations/AnimatedImage';

type NavType = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen = () => {
  const { events, interestedIds, savedIds, categoryFilter, loading, error, toggleInterest, toggleSave, setCategoryFilter, fetchEvents } = useEventsStore();
  const navigation = useNavigation<NavType>();
  const unread = useNotificationsStore((s) => s.unreadCount);

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
      <AnimatedCard index={index} staggerDelay={70} style={s.card}>
        <AnimatedPressable
          style={s.cardInner}
          onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
          activeScale={0.98}
        >
          <AnimatedImage
            source={{ uri: item.cover_image_url }}
            style={s.cover}
            containerStyle={s.coverContainer}
            delay={index * 40}
          />
          <View style={s.cardBody}>
            <Text style={s.cardDate}>{formatDateShort(item.starts_at)}</Text>
            <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={s.cardVenue}>{item.venue?.name}</Text>
            {proof ? <Text style={s.socialProof}>{proof}</Text> : null}
            <View style={s.actions}>
              <AnimatedPressable
                style={[s.interestBtn, isInterested && s.interestActive]}
                onPress={() => toggleInterest(item.id)}
                activeScale={0.94}
              >
                <Text style={[s.interestText, isInterested && s.interestTextActive]}>
                  {isInterested ? '✓ интересно' : 'интересно'}
                </Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={() => toggleSave(item.id)} activeScale={0.85}>
                <Text style={[s.saveIcon, isSaved && s.saveIconActive]}>{isSaved ? '★' : '☆'}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={s.planBtn}
                onPress={() => navigation.navigate('CreatePlanFromEvent', { eventId: item.id })}
                activeScale={0.95}
              >
                <Text style={s.planBtnText}>Планы?</Text>
              </AnimatedPressable>
            </View>
          </View>
        </AnimatedPressable>
      </AnimatedCard>
    );
  };

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <SpringFadeIn delay={60} direction="down" distance={16}>
          <View style={s.header}>
            <View style={s.headerTitleRow}>
              <Text style={s.headerTitle}>Планы?</Text>
              <View style={s.headerDot} />
            </View>
            <AnimatedNotificationBell
              count={unread}
              onPress={() => navigation.navigate('Notifications')}
              delay={240}
            />
          </View>
        </SpringFadeIn>

        <SpringFadeIn delay={140} direction="left" distance={20}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORY_CHIPS}
            keyExtractor={(c) => String(c.key ?? 'all')}
            contentContainerStyle={s.chipsContent}
            style={s.chipsRow}
            renderItem={({ item: chip, index }) => (
              <View style={s.chipWrap}>
                <AnimatedChip
                  label={chip.label}
                  active={categoryFilter === chip.key}
                  onPress={() => setCategoryFilter(chip.key as EventCategory | null)}
                  index={index}
                />
              </View>
            )}
          />
        </SpringFadeIn>

        {error ? (
          <SpringFadeIn delay={0} direction="down" distance={6}>
            <Text style={s.errorBanner}>{error}</Text>
          </SpringFadeIn>
        ) : null}

        {loading && filtered.length === 0 ? (
          <View style={s.list}>
            <Skeleton width="50%" height={14} style={s.skeletonMeta} />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(e) => e.id}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshing={loading && filtered.length > 0}
            onRefresh={fetchEvents}
            ListEmptyComponent={<EmptyState text="Нет мероприятий" />}
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  headerTitle: { ...theme.typography.h2, color: theme.colors.primary, letterSpacing: -0.5 },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 3,
  },
  chipsRow: { marginBottom: theme.spacing.md },
  chipsContent: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm },
  chipWrap: { marginRight: theme.spacing.sm },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    padding: 0,
    ...theme.shadows.md,
  },
  cardInner: { padding: 0 },
  coverContainer: {
    width: '100%',
    height: Platform.select({ web: 140, default: 180 }),
    aspectRatio: Platform.select({ web: 16 / 7, default: undefined }),
  },
  cover: { width: '100%', height: '100%' },
  cardBody: { padding: theme.spacing.lg, ...Platform.select({ web: { padding: theme.spacing.md } }) },
  cardDate: { ...theme.typography.caption, color: theme.colors.primary, marginBottom: theme.spacing.xs, fontWeight: '700', letterSpacing: 0.4 },
  cardTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  cardVenue: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  socialProof: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  interestBtn: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  interestActive: { backgroundColor: theme.colors.primaryLight + '22', borderColor: theme.colors.primaryLight },
  interestText: { ...theme.typography.small, color: theme.colors.textSecondary },
  interestTextActive: { color: theme.colors.primary, fontWeight: '700' },
  saveIcon: { fontSize: 22, color: theme.colors.textTertiary, paddingHorizontal: theme.spacing.sm },
  saveIconActive: { color: theme.colors.accent },
  planBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginLeft: 'auto',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  planBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 14, letterSpacing: 0.2 },
  skeletonMeta: { marginBottom: theme.spacing.md },
  errorBanner: {
    ...theme.typography.caption,
    color: theme.colors.error,
    textAlign: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '11',
  },
});
