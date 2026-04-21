import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { usePlansStore } from '../stores/plansStore';
import { useAuthStore } from '../stores/authStore';
import { useGroupsStore } from '../stores/groupsStore';
import { useInvitationsStore } from '../stores/invitationsStore';
import { formatDateShort } from '../utils/dates';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, AnimatedChip, GlassCard, PressableScale } from '../components/Animations';
import type { PlansStackParamList } from '../navigation/types';
import type { Plan, Group, Invitation } from '../types';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlansList'>;
type HubSection = 'active' | 'invitations' | 'groups' | 'past';

const STATUS_LABELS: Record<string, string> = { going: 'Иду', thinking: 'Думаю', cant: 'Не могу', invited: 'Приглашение' };
const STATUS_COLORS: Record<string, string> = { going: theme.colors.going, thinking: theme.colors.thinking, cant: theme.colors.cant, invited: theme.colors.invited };
const STATUS_ICONS: Record<string, string> = { going: 'checkmark-circle', thinking: 'help-circle-outline', cant: 'close-circle-outline', invited: 'mail-outline' };

export const PlansHubScreen = ({ navigation }: Props) => {
  const [section, setSection] = React.useState<HubSection>('active');
  const plans = usePlansStore((s) => s.plans);
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const groups = useGroupsStore((s) => s.groups);
  const { invitations, accept, decline, fetchInvitations } = useInvitationsStore();
  const fetchMyPlans = usePlansStore((s) => s.fetchMyPlans);

  React.useEffect(() => { fetchMyPlans(); fetchInvitations(); }, []);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const activePlans = plans.filter((p) => p.lifecycle_state === 'active' || p.lifecycle_state === 'finalized');
  const pastPlans = plans.filter((p) => p.lifecycle_state === 'completed');

  const sections: { key: HubSection; label: string; icon: string; count: number }[] = [
    { key: 'active', label: 'Активные', icon: 'flash', count: activePlans.length },
    { key: 'invitations', label: 'Приглашения', icon: 'mail', count: pendingInvitations.length },
    { key: 'groups', label: 'Группы', icon: 'people', count: groups.length },
    { key: 'past', label: 'Прошедшие', icon: 'time', count: pastPlans.length },
  ];

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <FadeIn>
          <View style={s.headerRow}>
            <Text style={s.header}>Мои планы</Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={s.tabs}>
            {sections.map((sec) => (
              <AnimatedChip
                key={sec.key}
                label={`${sec.label}${sec.count > 0 ? ` ${sec.count}` : ''}`}
                active={section === sec.key}
                onPress={() => setSection(sec.key)}
              />
            ))}
          </View>
        </FadeIn>

        {section === 'active' && (
          <FlatList data={activePlans} keyExtractor={(p) => p.id} renderItem={({ item, index }) => (
            <FadeIn delay={index * theme.anim.timing.stagger}>
              <PlanCard plan={item} userId={userId} onPress={() => navigation.navigate('PlanDetails', { planId: item.id })} />
            </FadeIn>
          )} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Нет активных планов" />} showsVerticalScrollIndicator={false} />
        )}
        {section === 'invitations' && (
          <FlatList data={pendingInvitations} keyExtractor={(i) => i.id} renderItem={({ item, index }) => (
            <FadeIn delay={index * theme.anim.timing.stagger}>
              <InvitationCard invitation={item} onAccept={() => accept(item.id)} onDecline={() => decline(item.id)} onOpen={() => {
                if (item.type === 'plan' && item.plan) navigation.navigate('PlanDetails', { planId: item.target_id });
                if (item.type === 'group') navigation.navigate('GroupDetails', { groupId: item.target_id });
              }} />
            </FadeIn>
          )} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Нет приглашений" />} showsVerticalScrollIndicator={false} />
        )}
        {section === 'groups' && (
          <FlatList data={groups} keyExtractor={(g) => g.id} renderItem={({ item, index }) => (
            <FadeIn delay={index * theme.anim.timing.stagger}>
              <GroupCard group={item} onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })} />
            </FadeIn>
          )} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Нет групп" />} showsVerticalScrollIndicator={false} />
        )}
        {section === 'past' && (
          <FlatList data={pastPlans} keyExtractor={(p) => p.id} renderItem={({ item, index }) => (
            <FadeIn delay={index * theme.anim.timing.stagger}>
              <PlanCard plan={item} userId={userId} onPress={() => navigation.navigate('PlanDetails', { planId: item.id })} />
            </FadeIn>
          )} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Нет прошедших планов" />} showsVerticalScrollIndicator={false} />
        )}
      </View>
    </ScreenContainer>
  );
};

const PlanCard = ({ plan, userId, onPress }: { plan: Plan; userId: string; onPress: () => void }) => {
  const statusLabel = plan.lifecycle_state === 'finalized' ? 'Подтверждён' : plan.lifecycle_state === 'completed' ? 'Завершён' : 'Активный';
  const myStatus = plan.participants?.find((p) => p.user_id === userId)?.status ?? 'invited';
  const color = STATUS_COLORS[myStatus];
  const label = STATUS_LABELS[myStatus];
  const icon = STATUS_ICONS[myStatus];

  return (
    <GlassCard animated={false}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={s.cardRow}>
          <View style={s.cardLeft}>
            <Text style={s.cardTitle}>{plan.title}</Text>
            <View style={s.metaRow}>
              <Ionicons name="people" size={12} color={theme.colors.textTertiary} />
              <Text style={s.cardMeta}>{plan.participants?.length ?? 0} чел.</Text>
            </View>
            {plan.confirmed_time && (
              <View style={s.metaRow}>
                <Ionicons name="time" size={12} color={theme.colors.textTertiary} />
                <Text style={s.cardMeta}>{formatDateShort(plan.confirmed_time)}</Text>
              </View>
            )}
          </View>
          <View style={[s.statusBadge, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon as any} size={12} color={color} />
            <Text style={[s.statusText, { color }]}>{label}</Text>
          </View>
        </View>
        <View style={s.lifecycleRow}>
          <View style={[s.lifecycleDot, { backgroundColor: plan.lifecycle_state === 'finalized' ? theme.colors.success : plan.lifecycle_state === 'active' ? theme.colors.cta : theme.colors.textTertiary }]} />
          <Text style={s.lifecycleText}>{statusLabel}</Text>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
};

const InvitationCard = ({ invitation, onAccept, onDecline, onOpen }: { invitation: Invitation; onAccept: () => void; onDecline: () => void; onOpen: () => void }) => (
  <GlassCard animated={false}>
    <TouchableOpacity onPress={onOpen} activeOpacity={0.85}>
      <View style={s.inviteIcon}>
        <Ionicons name={invitation.type === 'plan' ? 'calendar' : 'people'} size={18} color={theme.colors.primary} />
      </View>
      <Text style={s.cardTitle}>{invitation.type === 'plan' ? (invitation.plan?.title ?? 'Приглашение в план') : 'Приглашение в группу'}</Text>
      <Text style={s.cardMeta}>{invitation.type === 'plan' ? 'Приглашение в план' : 'Приглашение в группу'}</Text>
      <View style={s.inviteActions}>
        <PressableScale onPress={onAccept}>
          <View style={s.acceptBtn}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={s.acceptBtnText}>Принять</Text>
          </View>
        </PressableScale>
        <PressableScale onPress={onDecline}>
          <View style={s.declineBtn}>
            <Text style={s.declineBtnText}>Отклонить</Text>
          </View>
        </PressableScale>
      </View>
    </TouchableOpacity>
  </GlassCard>
);

const GroupCard = ({ group, onPress }: { group: Group; onPress: () => void }) => (
  <GlassCard animated={false}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardRow}>
        <View style={s.groupAvatar}>
          <Ionicons name="people" size={18} color={theme.colors.primary} />
        </View>
        <View style={s.cardLeft}>
          <Text style={s.cardTitle}>{group.name}</Text>
          <Text style={s.cardMeta}>{group.members?.length ?? 0} чел.</Text>
        </View>
      </View>
    </TouchableOpacity>
  </GlassCard>
);

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  headerRow: { paddingHorizontal: theme.spacing.lg, paddingTop: Platform.select({ web: theme.spacing.lg, default: theme.spacing.xl }), paddingBottom: theme.spacing.sm },
  header: { ...theme.typography.h2, color: theme.colors.textPrimary },
  tabs: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md, flexWrap: 'wrap', gap: theme.spacing.sm },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.sm },
  card: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: theme.borderRadius.lg, padding: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }), marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', ...theme.shadows.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flex: 1 },
  cardTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  cardMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full },
  statusText: { ...theme.typography.small, fontWeight: '600' },
  lifecycleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.sm },
  lifecycleDot: { width: 6, height: 6, borderRadius: 3 },
  lifecycleText: { ...theme.typography.small, color: theme.colors.textSecondary },
  inviteIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  inviteActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.going, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  declineBtn: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  declineBtnText: { color: theme.colors.error, fontWeight: '600', fontSize: 13 },
  groupAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
});
