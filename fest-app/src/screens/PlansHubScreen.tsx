import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { usePlansStore } from '../stores/plansStore';
import { useAuthStore } from '../stores/authStore';
import { useGroupsStore } from '../stores/groupsStore';
import { useInvitationsStore } from '../stores/invitationsStore';
import { formatDateShort } from '../utils/dates';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import type { PlansStackParamList } from '../navigation/types';
import type { Plan, Group, Invitation } from '../types';
import { AnimatedCard } from '../fest-animations/AnimatedCard';
import { AnimatedPressable } from '../fest-animations/AnimatedPressable';
import { AnimatedBadge } from '../fest-animations/AnimatedBadge';
import { SpringFadeIn } from '../fest-animations/SpringFadeIn';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlansList'>;
type HubSection = 'active' | 'invitations' | 'groups' | 'past';

const STATUS_LABELS: Record<string, string> = { going: 'Иду', thinking: 'Думаю', cant: 'Не могу', invited: 'Приглашение' };
const STATUS_COLORS: Record<string, string> = { going: theme.colors.going, thinking: theme.colors.thinking, cant: theme.colors.cant, invited: theme.colors.invited };

export const PlansHubScreen = ({ navigation }: Props) => {
  const [section, setSection] = React.useState<HubSection>('active');
  const plans = usePlansStore((s) => s.plans);
  const plansLoading = usePlansStore((s) => s.loading);
  const plansError = usePlansStore((s) => s.error);
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const groups = useGroupsStore((s) => s.groups);
  const groupsLoading = useGroupsStore((s) => s.loading);
  const groupsError = useGroupsStore((s) => s.error);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const { invitations, loading: invLoading, error: invError, accept, decline, fetchInvitations } = useInvitationsStore();
  const fetchMyPlans = usePlansStore((s) => s.fetchMyPlans);
  const [accepting, setAccepting] = React.useState<string | null>(null);
  const [declining, setDeclining] = React.useState<string | null>(null);

  React.useEffect(() => { fetchMyPlans(); fetchInvitations(); fetchGroups(); }, [fetchMyPlans, fetchInvitations, fetchGroups]);

  const handleAccept = async (id: string) => {
    if (accepting) return;
    setAccepting(id);
    await accept(id);
    setAccepting(null);
  };

  const handleDecline = async (id: string) => {
    if (declining) return;
    setDeclining(id);
    await decline(id);
    setDeclining(null);
  };

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const activePlans = plans.filter((p) => p.lifecycle_state === 'active' || p.lifecycle_state === 'finalized');
  const pastPlans = plans.filter((p) => p.lifecycle_state === 'completed');

  const sections: { key: HubSection; label: string; count: number }[] = [
    { key: 'active', label: 'Активные', count: activePlans.length },
    { key: 'invitations', label: 'Приглашения', count: pendingInvitations.length },
    { key: 'groups', label: 'Группы', count: groups.length },
    { key: 'past', label: 'Прошедшие', count: pastPlans.length },
  ];

  const activeIndex = sections.findIndex((x) => x.key === section);
  const indicatorProgress = useSharedValue(activeIndex);
  React.useEffect(() => {
    indicatorProgress.value = withSpring(activeIndex, { damping: 18, stiffness: 220, mass: 0.7 });
  }, [activeIndex]);

  const [tabBarWidth, setTabBarWidth] = React.useState(0);
  const tabWidth = tabBarWidth / sections.length;

  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      indicatorProgress.value,
      sections.map((_, i) => i),
      sections.map((_, i) => i * tabWidth),
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }], width: tabWidth };
  });

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <SpringFadeIn delay={60} direction="down" distance={14}>
          <Text style={s.header}>Мои планы</Text>
        </SpringFadeIn>

        <SpringFadeIn delay={140} direction="up" distance={10}>
          <View style={s.tabsContainer} onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}>
            {tabBarWidth > 0 ? (
              <Animated.View style={[s.tabIndicator, indicatorStyle]} pointerEvents="none" />
            ) : null}
            {sections.map((sec) => {
              const isActive = section === sec.key;
              return (
                <AnimatedPressable
                  key={sec.key}
                  style={s.tab}
                  onPress={() => setSection(sec.key)}
                  activeScale={0.97}
                >
                  <Text style={[s.tabText, isActive && s.tabTextActive]}>{sec.label}</Text>
                  {sec.count > 0 ? (
                    <View style={s.tabBadge}>
                      <Text style={s.tabBadgeText}>{sec.count}</Text>
                    </View>
                  ) : null}
                </AnimatedPressable>
              );
            })}
          </View>
        </SpringFadeIn>

        {section === 'active' && plansError ? <Text style={s.errorBanner}>{plansError}</Text> : null}
        {section === 'invitations' && invError ? <Text style={s.errorBanner}>{invError}</Text> : null}
        {section === 'groups' && groupsError ? <Text style={s.errorBanner}>{groupsError}</Text> : null}

        {(section === 'active' && plansLoading && activePlans.length === 0) ||
        (section === 'invitations' && invLoading && pendingInvitations.length === 0) ||
        (section === 'groups' && groupsLoading && groups.length === 0) ? (
          <View style={s.loader}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        ) : (
          <>
            {section === 'active' && (
              <FlatList
                data={activePlans}
                keyExtractor={(p) => p.id}
                renderItem={({ item, index }) => (
                  <PlanCard index={index} plan={item} userId={userId} onPress={() => navigation.navigate('PlanDetails', { planId: item.id })} />
                )}
                contentContainerStyle={s.list}
                ListEmptyComponent={<EmptyState text="Нет активных планов" />}
              />
            )}
            {section === 'invitations' && (
              <FlatList
                data={pendingInvitations}
                keyExtractor={(i) => i.id}
                renderItem={({ item, index }) => (
                  <InvitationCard
                    index={index}
                    invitation={item}
                    onAccept={() => handleAccept(item.id)}
                    onDecline={() => handleDecline(item.id)}
                    accepting={accepting === item.id}
                    declining={declining === item.id}
                    onOpen={() => {
                      if (item.type === 'plan' && item.plan) navigation.navigate('PlanDetails', { planId: item.target_id });
                      if (item.type === 'group') navigation.navigate('GroupDetails', { groupId: item.target_id });
                    }}
                  />
                )}
                contentContainerStyle={s.list}
                ListEmptyComponent={<EmptyState text="Нет приглашений" />}
              />
            )}
            {section === 'groups' && (
              <FlatList
                data={groups}
                keyExtractor={(g) => g.id}
                renderItem={({ item, index }) => (
                  <GroupCard index={index} group={item} onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })} />
                )}
                contentContainerStyle={s.list}
                ListEmptyComponent={<EmptyState text="Нет групп" />}
              />
            )}
            {section === 'past' && (
              <FlatList
                data={pastPlans}
                keyExtractor={(p) => p.id}
                renderItem={({ item, index }) => (
                  <PlanCard index={index} plan={item} userId={userId} onPress={() => navigation.navigate('PlanDetails', { planId: item.id })} />
                )}
                contentContainerStyle={s.list}
                ListEmptyComponent={<EmptyState text="Нет прошедших планов" />}
              />
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
};

const PlanCard = ({ plan, userId, onPress, index }: { plan: Plan; userId: string; onPress: () => void; index: number }) => {
  const statusLabel = plan.lifecycle_state === 'finalized' ? '✓ Подтверждён' : plan.lifecycle_state === 'completed' ? 'Завершён' : 'Активный';
  const myStatus = plan.participants?.find((p) => p.user_id === userId)?.status ?? 'invited';
  const color = STATUS_COLORS[myStatus];
  const label = STATUS_LABELS[myStatus];

  return (
    <AnimatedCard index={index} staggerDelay={60} style={s.card}>
      <AnimatedPressable style={s.cardInner} onPress={onPress} activeScale={0.98}>
        <View style={s.cardRow}>
          <Text style={s.cardTitle} numberOfLines={1}>{plan.title}</Text>
          <AnimatedBadge label={label} color={color} pulse={myStatus === 'going'} delay={index * 60 + 120} />
        </View>
        <Text style={s.cardMeta}>{statusLabel} · {plan.participants?.length ?? 0} чел.</Text>
        {plan.confirmed_time ? <Text style={s.cardMeta}>{formatDateShort(plan.confirmed_time)}</Text> : null}
      </AnimatedPressable>
    </AnimatedCard>
  );
};

const InvitationCard = ({ invitation, onAccept, onDecline, accepting, declining, onOpen, index }: { invitation: Invitation; onAccept: () => void; onDecline: () => void; accepting: boolean; declining: boolean; onOpen: () => void; index: number }) => (
  <AnimatedCard index={index} staggerDelay={60} style={s.card}>
    <AnimatedPressable style={s.cardInner} onPress={onOpen} activeScale={0.98}>
      <Text style={s.cardTitle}>{invitation.type === 'plan' ? (invitation.plan?.title ?? 'Приглашение в план') : 'Приглашение в группу'}</Text>
      <Text style={s.cardMeta}>{invitation.type === 'plan' ? 'Приглашение в план' : 'Приглашение в группу'}</Text>
      <View style={s.inviteActions}>
        <AnimatedPressable style={[s.acceptBtn, accepting && s.btnDisabled]} onPress={onAccept} disabled={accepting} activeScale={0.95}>
          <Text style={s.acceptBtnText}>{accepting ? '...' : 'Принять'}</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.declineBtn, declining && s.btnDisabled]} onPress={onDecline} disabled={declining} activeScale={0.95}>
          <Text style={s.declineBtnText}>{declining ? '...' : 'Отклонить'}</Text>
        </AnimatedPressable>
      </View>
    </AnimatedPressable>
  </AnimatedCard>
);

const GroupCard = ({ group, onPress, index }: { group: Group; onPress: () => void; index: number }) => (
  <AnimatedCard index={index} staggerDelay={60} style={s.card}>
    <AnimatedPressable style={s.cardInner} onPress={onPress} activeScale={0.98}>
      <Text style={s.cardTitle}>{group.name}</Text>
      <Text style={s.cardMeta}>{group.members?.length ?? 0} чел.</Text>
    </AnimatedPressable>
  </AnimatedCard>
);

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  header: { ...theme.typography.h2, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.lg, paddingTop: Platform.select({ web: theme.spacing.lg, default: theme.spacing.xl }), paddingBottom: theme.spacing.sm, letterSpacing: -0.5 },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.full,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tabText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: theme.colors.textInverse, fontWeight: '700' },
  tabBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { color: theme.colors.textInverse, fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    padding: 0,
    ...theme.shadows.sm,
  },
  cardInner: { padding: theme.spacing.lg },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs, gap: theme.spacing.sm },
  cardTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, flex: 1 },
  cardMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  inviteActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 14 },
  declineBtn: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  declineBtnText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: { ...theme.typography.caption, color: theme.colors.error, textAlign: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.error + '11' },
});
