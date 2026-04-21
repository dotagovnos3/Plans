import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { theme } from '../theme';
import { usePlansStore } from '../stores/plansStore';
import { useAuthStore } from '../stores/authStore';
import { ACTIVITY_LABELS, type Plan, type ParticipantStatus } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import type { PlansStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlanDetails'>;

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Animated Status Badge with pulse
const StatusBadge: React.FC<{ status: ParticipantStatus; delay?: number }> = ({ status, delay = 0 }) => {
  const progress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  const colors: Record<ParticipantStatus, string> = {
    going: theme.colors.going,
    thinking: theme.colors.thinking,
    cant: theme.colors.cant,
    invited: theme.colors.invited,
  };

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 200 }));
    if (status === 'going') {
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [status, delay]);

  const style = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseProgress.value, [0, 1], [1, 1.4], Extrapolation.CLAMP);
    const opacity = interpolate(pulseProgress.value, [0, 1], [0.5, 0], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  const labels: Record<ParticipantStatus, string> = {
    going: 'Иду',
    thinking: 'Думаю',
    cant: 'Не могу',
    invited: 'Приглашение',
  };

  return (
    <AnimatedView style={[s.badgeContainer, style]}>
      {status === 'going' && (
        <AnimatedView style={[s.pulse, { backgroundColor: colors[status] }, pulseStyle]} />
      )}
      <View style={[s.badge, { backgroundColor: colors[status] + '22' }]}>
        <Text style={[s.badgeText, { color: colors[status] }]}>{labels[status]}</Text>
      </View>
    </AnimatedView>
  );
};

// Animated Participant Row
const ParticipantRow: React.FC<{
  participant: any;
  index: number;
  isCreator: boolean;
  creatorId: string;
  onRemove?: () => void;
}> = ({ participant, index, isCreator, creatorId, onRemove }) => {
  const progress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 60, withSpring(1, { damping: 14, stiffness: 200 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-30, 0], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(hoverProgress.value, [0, 1], [1, 1.02], Extrapolation.CLAMP);

    return { transform: [{ translateX }, { scale }], opacity };
  });

  const handleHoverIn = () => {
    hoverProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleHoverOut = () => {
    hoverProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[s.participantRow, animatedStyle]}
      onPressIn={handleHoverIn}
      onPressOut={handleHoverOut}
    >
      <Animated.View style={[s.avatar, animatedStyle]}>
        <Text style={s.avatarText}>{participant.user?.name?.[0] ?? '?'}</Text>
      </Animated.View>
      <View style={s.participantInfo}>
        <Text style={s.participantName}>
          {participant.user?.name ?? '???'}
          {participant.user_id === creatorId && <Text style={s.creatorTag}> (создатель)</Text>}
        </Text>
      </View>
      <StatusBadge status={participant.status} delay={index * 60 + 200} />
      {isCreator && participant.user_id !== creatorId && onRemove && (
        <AnimatedPressable style={s.removeBtn} onPress={onRemove}>
          <Text style={s.removeBtnText}>✕</Text>
        </AnimatedPressable>
      )}
    </AnimatedPressable>
  );
};

// Animated Status Button
const StatusButton: React.FC<{
  status: ParticipantStatus;
  label: string;
  isActive: boolean;
  onPress: () => void;
  index: number;
}> = ({ status, label, isActive, onPress, index }) => {
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    activeProgress.value = withSpring(isActive ? 1 : 0, { damping: 15, stiffness: 400, mass: 0.8 });
  }, [isActive]);

  const colors: Record<ParticipantStatus, string> = {
    going: theme.colors.going,
    thinking: theme.colors.thinking,
    cant: theme.colors.cant,
    invited: theme.colors.invited,
  };

  const style = useAnimatedStyle(() => {
    const bg = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.surface, colors[status] + '22']
    );
    const borderColor = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.border, colors[status]]
    );
    const scale = interpolate(pressProgress.value, [0, 1], [1, 0.95], Extrapolation.CLAMP);

    return { backgroundColor: bg, borderColor, transform: [{ scale }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.textSecondary, colors[status]]
    );
    return { color };
  });

  return (
    <AnimatedPressable
      style={[s.statusBtn, style]}
      onPress={onPress}
      onPressIn={() => (pressProgress.value = withSpring(1))}
      onPressOut={() => (pressProgress.value = withSpring(0))}
    >
      <Animated.Text style={[s.statusBtnText, textStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
};

import { interpolateColor } from 'react-native-reanimated';

export const PlanDetailsScreenAnimated: React.FC<Props> = ({ route, navigation }) => {
  const { planId } = route.params;
  const plans = usePlansStore((s) => s.plans);
  const messages = usePlansStore((s) => s.messages);
  const { apiUpdateParticipantStatus, apiRemoveParticipant, apiCancelPlan } = usePlansStore();
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<'details' | 'chat'>('details');
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const plan = plans.find((p) => p.id === planId);
  if (!plan || !user) {
    return (
      <ScreenContainer>
        <View style={s.inner}>
          <EmptyState text="План не найден" />
        </View>
      </ScreenContainer>
    );
  }

  const isCreator = plan.creator_id === user.id;
  const myStatus = plan.participants?.find((p) => p.user_id === user.id)?.status ?? 'invited';

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.95], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [0, 100], [1, 0.98], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  const handleRemoveParticipant = (userId: string) => {
    Alert.alert('Удалить участника', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => apiRemoveParticipant(planId, userId) },
    ]);
  };

  const statusBtns: { key: ParticipantStatus; label: string }[] = [
    { key: 'going', label: 'Иду' },
    { key: 'thinking', label: 'Думаю' },
    { key: 'cant', label: 'Не могу' },
  ];

  return (
    <ScreenContainer>
      <View style={s.inner}>
        {/* Animated Header */}
        <AnimatedView style={[s.header, headerStyle]}>
          <AnimatedPressable style={s.backBtn} onPress={() => navigation.goBack()}>
            <Animated.Text style={s.backText}>← Назад</Animated.Text>
          </AnimatedPressable>
          <View style={s.headerRow}>
            <Text style={s.title}>{plan.title}</Text>
            <Text style={s.activity}>{ACTIVITY_LABELS[plan.activity_type]}</Text>
          </View>
        </AnimatedView>

        {/* Animated Tabs */}
        <View style={s.tabContainer}>
          <View style={s.tabRow}>
            {['details', 'chat'].map((t, i) => {
              const isActive = tab === t;
              const activeProgress = useSharedValue(isActive ? 1 : 0);

              useEffect(() => {
                activeProgress.value = withSpring(isActive ? 1 : 0, { damping: 20, stiffness: 300 });
              }, [isActive]);

              const textStyle = useAnimatedStyle(() => {
                const color = interpolateColor(
                  activeProgress.value,
                  [0, 1],
                  [theme.colors.textSecondary, theme.colors.primary]
                );
                return { color };
              });

              return (
                <AnimatedPressable
                  key={t}
                  style={s.tab}
                  onPress={() => setTab(t as 'details' | 'chat')}
                >
                  <Animated.Text style={[s.tabText, textStyle]}>
                    {t === 'details' ? 'Детали' : 'Чат'}
                  </Animated.Text>
                  {isActive && (
                    <Animated.View
                      layout={{
                        duration: 300,
                      }}
                      style={s.tabIndicator}
                    />
                  )}
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        <AnimatedScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {tab === 'details' && (
            <View>
              {/* Status Section */}
              <AnimatedView style={s.section}>
                <Text style={s.sectionTitle}>Ваш статус</Text>
                <View style={s.statusRow}>
                  {statusBtns.map((btn, i) => (
                    <StatusButton
                      key={btn.key}
                      status={btn.key}
                      label={btn.label}
                      isActive={myStatus === btn.key}
                      onPress={() => apiUpdateParticipantStatus(planId, user.id, btn.key)}
                      index={i}
                    />
                  ))}
                </View>
              </AnimatedView>

              {/* Participants Section */}
              <AnimatedView style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Участники</Text>
                  <Text style={s.participantCount}>{plan.participants?.length ?? 0}</Text>
                </View>
                {plan.participants?.map((p, i) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    index={i}
                    isCreator={isCreator}
                    creatorId={plan.creator_id}
                    onRemove={isCreator ? () => handleRemoveParticipant(p.user_id) : undefined}
                  />
                ))}
              </AnimatedView>
            </View>
          )}
        </AnimatedScrollView>

        {/* Floating Action Button */}
        {isCreator && (
          <AnimatedPressable
            style={s.fab}
            onPress={() => apiCancelPlan(planId)}
          >
            <Text style={s.fabText}>Отменить план</Text>
          </AnimatedPressable>
        )}
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  backBtn: { marginBottom: theme.spacing.md },
  backText: { ...theme.typography.body, color: theme.colors.textSecondary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary, flex: 1 },
  activity: { ...theme.typography.caption, color: theme.colors.primary, marginLeft: theme.spacing.md },
  tabContainer: { marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.md },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: theme.spacing.md, alignItems: 'center' },
  tabText: { ...theme.typography.bodyBold },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  section: { marginBottom: theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  participantCount: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statusRow: { flexDirection: 'row', gap: theme.spacing.sm },
  statusBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusBtnText: { ...theme.typography.bodyBold },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: { color: theme.colors.textInverse, fontWeight: '600', fontSize: 16 },
  participantInfo: { flex: 1 },
  participantName: { ...theme.typography.body, color: theme.colors.textPrimary },
  creatorTag: { ...theme.typography.caption, color: theme.colors.primary },
  badgeContainer: { position: 'relative' },
  pulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: theme.borderRadius.full,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: { ...theme.typography.small, fontWeight: '700' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.error + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  removeBtnText: { color: theme.colors.error, fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xxl,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: { color: theme.colors.textInverse, fontWeight: '600' },
});
