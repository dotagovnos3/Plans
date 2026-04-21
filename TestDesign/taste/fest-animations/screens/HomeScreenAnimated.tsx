import React, { useEffect } from 'react';
import { View, FlatList, Text, Image, StyleSheet, Platform } from 'react-native';
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

// Animation imports
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

type NavType = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const AnimatedPressable = Animated.createAnimatedComponent(require('react-native').TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

// Animated Card Component
const AnimatedEventCard: React.FC<{ 
  item: Event; 
  index: number;
  onPress: () => void;
  isInterested: boolean;
  isSaved: boolean;
  onToggleInterest: () => void;
  onToggleSave: () => void;
  onCreatePlan: () => void;
  socialProof: string | null;
}> = ({ 
  item, 
  index, 
  onPress,
  isInterested,
  isSaved,
  onToggleInterest,
  onToggleSave,
  onCreatePlan,
  socialProof,
}) => {
  const entryProgress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * 80,
      withSpring(1, { damping: 14, stiffness: 200, mass: 0.6 })
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(entryProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(entryProgress.value, [0, 1], [50, 0], Extrapolation.CLAMP);
    const scale = interpolate(entryProgress.value, [0, 1], [0.95, 1], Extrapolation.CLAMP);
    
    const hoverTranslateY = interpolate(hoverProgress.value, [0, 1], [0, -6], Extrapolation.CLAMP);
    const hoverScale = interpolate(hoverProgress.value, [0, 1], [1, 1.015], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(hoverProgress.value, [0, 1], [0.06, 0.12], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [
        { translateY: translateY + hoverTranslateY },
        { scale: scale * hoverScale },
      ],
      shadowOpacity,
    };
  });

  const handleHoverIn = () => {
    hoverProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleHoverOut = () => {
    hoverProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  const buttonPressProgress = useSharedValue(0);
  
  const interestButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(buttonPressProgress.value, [0, 1], [1, 0.92], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <AnimatedPressable
      style={[s.card, animatedStyle]}
      onPress={onPress}
      onPressIn={handleHoverIn}
      onPressOut={handleHoverOut}
      onPointerEnter={Platform.OS === 'web' ? handleHoverIn : undefined}
      onPointerLeave={Platform.OS === 'web' ? handleHoverOut : undefined}
      activeOpacity={1}
    >
      <Animated.Image
        source={{ uri: item.cover_image_url }}
        style={s.cover}
        resizeMode="cover"
      />
      <View style={s.cardBody}>
        <Text style={s.cardDate}>{formatDateShort(item.starts_at)}</Text>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.cardVenue}>{item.venue?.name}</Text>
        {socialProof && <Text style={s.socialProof}>{socialProof}</Text>}
        <View style={s.actions}>
          <AnimatedPressable
            style={[s.interestBtn, isInterested && s.interestActive, interestButtonStyle]}
            onPress={onToggleInterest}
            onPressIn={() => { buttonPressProgress.value = withSpring(1); }}
            onPressOut={() => { buttonPressProgress.value = withSpring(0); }}
          >
            <Text style={[s.interestText, isInterested && s.interestTextActive]}>интересно</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={onToggleSave}>
            <Animated.Text style={s.saveIcon}>{isSaved ? '★' : '☆'}</Animated.Text>
          </AnimatedPressable>
          <AnimatedPressable 
            style={s.planBtn}
            onPress={onCreatePlan}
          >
            <Text style={s.planBtnText}>Планы?</Text>
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedPressable>
  );
};

// Animated Header Component
const AnimatedHeader: React.FC<{ title: string; onNotifications: () => void; unread: number }> = ({
  title,
  onNotifications,
  unread,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 13, stiffness: 180, mass: 0.7 });
  }, []);

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [-30, 0], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY }], opacity };
  });

  const badgeBounce = useSharedValue(0);
  const prevUnread = React.useRef(unread);

  useEffect(() => {
    if (unread > prevUnread.current && unread > 0) {
      badgeBounce.value = withSpring(-8, { damping: 8, stiffness: 400 });
    }
    prevUnread.current = unread;
  }, [unread]);

  const badgeStyle = useAnimatedStyle(() => {
    const bounceY = badgeBounce.value;
    const scale = interpolate(badgeBounce.value, [-8, 0], [1.2, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY: bounceY }, { scale }] };
  });

  return (
    <AnimatedView style={[s.header, headerStyle]}>
      <Text style={s.headerTitle}>{title}</Text>
      <AnimatedPressable style={s.bell} onPress={onNotifications}>
        <Text style={s.bellIcon}>🔔</Text>
        {unread > 0 && (
          <AnimatedView style={[s.badge, badgeStyle]}>
            <Text style={s.badgeText}>{unread}</Text>
          </AnimatedView>
        )}
      </AnimatedPressable>
    </AnimatedView>
  );
};

// Animated Chip Component
const AnimatedChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  index: number;
}> = ({ label, active, onPress, index }) => {
  const activeProgress = useSharedValue(active ? 1 : 0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    activeProgress.value = withSpring(active ? 1 : 0, {
      damping: 15, stiffness: 400, mass: 0.8,
    });
  }, [active]);

  const chipStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.surface, theme.colors.primary]
    );
    const border = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    );
    const scale = interpolate(pressProgress.value, [0, 1], [1, 0.92], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(activeProgress.value, [0, 1], [0, 0.2], Extrapolation.CLAMP);

    return { backgroundColor: bg, borderColor: border, transform: [{ scale }], shadowOpacity };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.textSecondary, theme.colors.textInverse]
    );
    return { color };
  });

  return (
    <AnimatedPressable
      style={[s.chip, chipStyle, { shadowColor: theme.colors.primary }]}
      onPress={onPress}
      onPressIn={() => (pressProgress.value = withSpring(1))}
      onPressOut={() => (pressProgress.value = withSpring(0))}
    >
      <Animated.Text style={[s.chipText, textStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
};

import { interpolateColor } from 'react-native-reanimated';

export const HomeScreenAnimated = () => {
  const { events, interestedIds, savedIds, categoryFilter, toggleInterest, toggleSave, setCategoryFilter, fetchEvents } = useEventsStore();
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
      <AnimatedEventCard
        item={item}
        index={index}
        onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        isInterested={isInterested}
        isSaved={isSaved}
        onToggleInterest={() => toggleInterest(item.id)}
        onToggleSave={() => toggleSave(item.id)}
        onCreatePlan={() => navigation.navigate('CreatePlanFromEvent', { eventId: item.id })}
        socialProof={proof}
      />
    );
  };

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <AnimatedHeader
          title="Планы?"
          onNotifications={() => navigation.navigate('Notifications')}
          unread={unread}
        />
        <View style={s.chipsRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORY_CHIPS}
            keyExtractor={(c) => String(c.key ?? 'all')}
            renderItem={({ item: chip, index }) => (
              <AnimatedChip
                label={chip.label}
                active={categoryFilter === chip.key}
                onPress={() => setCategoryFilter(chip.key as EventCategory | null)}
                index={index}
              />
            )}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState text="Нет мероприятий" />}
        />
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
  headerTitle: { ...theme.typography.h2, color: theme.colors.primary },
  bell: { position: 'relative', padding: theme.spacing.sm },
  bellIcon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chipsRow: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  chipText: { ...theme.typography.caption, fontWeight: '600' },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  cover: { width: '100%', height: Platform.select({ web: 140, default: 180 }), aspectRatio: Platform.select({ web: 16 / 7, default: undefined }) },
  cardBody: { padding: theme.spacing.lg, ...Platform.select({ web: { padding: theme.spacing.md } }) },
  cardDate: { ...theme.typography.caption, color: theme.colors.primary, marginBottom: theme.spacing.xs },
  cardTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  cardVenue: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  socialProof: { ...theme.typography.caption, color: theme.colors.primaryLight, marginBottom: theme.spacing.sm },
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
  interestTextActive: { color: theme.colors.primary, fontWeight: '600' },
  saveIcon: { fontSize: 20, color: theme.colors.textTertiary, paddingHorizontal: theme.spacing.sm },
  planBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginLeft: 'auto',
  },
  planBtnText: { color: theme.colors.textInverse, fontWeight: '600', fontSize: 14 },
});
