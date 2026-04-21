import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { useGroupsStore } from '../stores/groupsStore';
import { usePlansStore } from '../stores/plansStore';
import { formatDateShort } from '../utils/dates';
import { ACTIVITY_LABELS, type Plan, type PlanParticipant, type ActivityType } from '../types';
import { mockUsers } from '../mocks';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, GlassCard, PressableScale } from '../components/Animations';
import type { PlansStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PlansStackParamList, 'GroupDetails'>;

export const GroupDetailsScreen = ({ route, navigation }: Props) => {
  const { groupId } = route.params;
  const groups = useGroupsStore((s) => s.groups);
  const plans = usePlansStore((s) => s.plans);
  const addPlan = usePlansStore((s) => s.addPlan);
  const user = useAuthStore((s) => s.user);

  const group = groups.find((g) => g.id === groupId);

  if (!group) return <ScreenContainer><View style={s.inner}><Text style={s.empty}>Группа не найдена</Text></View></ScreenContainer>;

  const groupMemberIds = new Set((group.members ?? []).map((m) => m.user_id));
  const groupPlans = plans.filter((p) => p.participants?.some((pp) => groupMemberIds.has(pp.user_id)));
  const activePlans = groupPlans.filter((p) => p.lifecycle_state === 'active' || p.lifecycle_state === 'finalized');
  const pastPlans = groupPlans.filter((p) => p.lifecycle_state === 'completed');

  const handleCreatePlanWithGroup = () => {
    if (!user) return;
    const participants: PlanParticipant[] = (group.members ?? [])
      .filter((m) => m.user_id !== user.id)
      .map((m) => ({ id: `pp-${Date.now()}-${m.user_id}`, plan_id: '', user_id: m.user_id, status: 'invited' as const, joined_at: new Date().toISOString(), user: m.user }));
    const plan: Plan = {
      id: `plan-${Date.now()}`, creator_id: user.id, title: `План: ${group.name}`, activity_type: 'other' as ActivityType,
      linked_event_id: null, place_status: 'undecided', time_status: 'undecided',
      confirmed_place_text: null, confirmed_place_lat: null, confirmed_place_lng: null,
      confirmed_time: null, lifecycle_state: 'active', pre_meet_enabled: false,
      pre_meet_place_text: null, pre_meet_time: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      participants: [{ id: `pp-me-${Date.now()}`, plan_id: '', user_id: user.id, status: 'going' as const, joined_at: new Date().toISOString(), user }, ...participants],
      proposals: [],
    };
    addPlan(plan);
    navigation.replace('PlanDetails', { planId: plan.id });
  };

  return (
    <ScreenContainer>
      <ScrollView style={s.inner} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={s.backCircle}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
          </View>
        </TouchableOpacity>

        <FadeIn>
          <View style={s.headerCircle}>
            <Ionicons name="people" size={28} color={theme.colors.primary} />
          </View>
          <Text style={s.groupName}>{group.name}</Text>
          <View style={s.metaRow}>
            <Ionicons name="people" size={14} color={theme.colors.textTertiary} />
            <Text style={s.groupMeta}>{group.members?.length ?? 0} чел.</Text>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <Text style={s.sectionTitle}>Участники</Text>
          {group.members?.map((m, i) => (
            <FadeIn key={m.id} delay={100 + i * 30}>
              <View style={s.memberRow}>
                <View style={s.avatar}><Text style={s.avatarLetter}>{m.user?.name?.[0] ?? '?'}</Text></View>
                <Text style={s.memberName}>{m.user?.name ?? 'Неизвестный'}</Text>
              </View>
            </FadeIn>
          ))}
        </FadeIn>

        {activePlans.length > 0 && (
          <FadeIn delay={200}>
            <Text style={s.sectionTitle}>Предстоящие планы</Text>
            {activePlans.map((p, i) => (
              <FadeIn key={p.id} delay={200 + i * 40}>
                <GlassCard animated={false}>
                  <TouchableOpacity onPress={() => navigation.navigate('PlanDetails', { planId: p.id })} activeOpacity={0.85}>
                    <Text style={s.planTitle}>{p.title}</Text>
                    <View style={s.metaRow}>
                      <Ionicons name="pricetag" size={12} color={theme.colors.textTertiary} />
                      <Text style={s.planMeta}>{ACTIVITY_LABELS[p.activity_type]} · {p.participants?.length ?? 0} чел.</Text>
                    </View>
                  </TouchableOpacity>
                </GlassCard>
              </FadeIn>
            ))}
          </FadeIn>
        )}

        {pastPlans.length > 0 && (
          <FadeIn delay={300}>
            <Text style={s.sectionTitle}>Прошедшие планы</Text>
            {pastPlans.map((p, i) => (
              <FadeIn key={p.id} delay={300 + i * 40}>
                <GlassCard animated={false}>
                  <TouchableOpacity onPress={() => navigation.navigate('PlanDetails', { planId: p.id })} activeOpacity={0.85}>
                    <Text style={s.planTitle}>{p.title}</Text>
                    <View style={s.metaRow}>
                      <Ionicons name="pricetag" size={12} color={theme.colors.textTertiary} />
                      <Text style={s.planMeta}>{ACTIVITY_LABELS[p.activity_type]}</Text>
                    </View>
                  </TouchableOpacity>
                </GlassCard>
              </FadeIn>
            ))}
          </FadeIn>
        )}

        <PressableScale onPress={handleCreatePlanWithGroup}>
          <View style={s.createBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={s.createBtnText}>Создать план с группой</Text>
          </View>
        </PressableScale>
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, ...Platform.select({ web: { paddingBottom: theme.spacing.xxl } }) },
  backBtn: { marginBottom: Platform.select({ web: theme.spacing.sm, default: theme.spacing.md }) },
  backCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', ...theme.shadows.sm },
  headerCircle: { width: Platform.select({ web: 56, default: 72 }), height: Platform.select({ web: 56, default: 72 }), borderRadius: Platform.select({ web: 28, default: 36 }), backgroundColor: theme.colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, borderWidth: 2, borderColor: theme.colors.primary + '25' },
  groupName: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs, ...Platform.select({ web: { ...theme.typography.h3 } }) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.lg },
  groupMeta: { ...theme.typography.caption, color: theme.colors.textTertiary },
  sectionTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md, ...Platform.select({ web: { marginTop: theme.spacing.sm } }) },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Platform.select({ web: 4, default: theme.spacing.sm }) },
  avatar: { width: Platform.select({ web: 30, default: 36 }), height: Platform.select({ web: 30, default: 36 }), borderRadius: Platform.select({ web: 15, default: 18 }), backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm },
  avatarLetter: { fontSize: Platform.select({ web: 13, default: 16 }), fontWeight: '700', color: theme.colors.primary },
  memberName: { ...theme.typography.body, color: theme.colors.textPrimary },
  planTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  planMeta: { ...theme.typography.caption, color: theme.colors.textTertiary },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, paddingVertical: Platform.select({ web: theme.spacing.md, default: theme.spacing.xl }), marginTop: theme.spacing.xl, ...theme.shadows.glow },
  createBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: Platform.select({ web: 15, default: 16 }) },
  empty: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 100 },
});
