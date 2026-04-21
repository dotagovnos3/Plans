import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { usePlansStore } from '../stores/plansStore';
import { useGroupsStore } from '../stores/groupsStore';
import { useInvitationsStore } from '../stores/invitationsStore';
import { ACTIVITY_LABELS, type ActivityType, type Plan } from '../types';
import { mockUsers } from '../mocks';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, AnimatedChip, GlassCard, PressableScale } from '../components/Animations';

const MAX_PARTICIPANTS = 15;

interface FriendItem {
  id: string;
  name: string;
  selected: boolean;
}

interface Props {
  linkedEventId?: string;
  linkedEventTitle?: string;
  linkedEventVenue?: string;
  linkedEventTime?: string;
  onDone: (newPlanId: string) => void;
  preselectedGroupIds?: string[];
}

export const CreatePlanForm = ({ linkedEventId, linkedEventTitle, linkedEventVenue, linkedEventTime, onDone, preselectedGroupIds }: Props) => {
  const user = useAuthStore((s) => s.user);
  const addPlan = usePlansStore((s) => s.addPlan);
  const apiCreatePlan = usePlansStore((s) => s.apiCreatePlan);
  const groups = useGroupsStore((s) => s.groups);
  const addInvitation = useInvitationsStore((s) => s.addInvitation);

  const isFromEvent = !!linkedEventId;

  const [activityType, setActivityType] = useState<ActivityType>(isFromEvent ? 'other' : 'cinema');
  const [title, setTitle] = useState(linkedEventTitle ?? '');
  const [placeText, setPlaceText] = useState(linkedEventVenue ?? '');
  const [timeText, setTimeText] = useState(linkedEventTime ?? '');
  const [preMeetEnabled, setPreMeetEnabled] = useState(false);
  const [preMeetPlace, setPreMeetPlace] = useState('');
  const [preMeetTime, setPreMeetTime] = useState('');
  const [friends, setFriends] = useState<FriendItem[]>(
    (() => {
      const base = mockUsers.filter((u) => u.id !== 'me').map((u) => ({ id: u.id, name: u.name, selected: false }));
      if (preselectedGroupIds?.length) {
        const memberIds = new Set<string>();
        preselectedGroupIds.forEach((gid) => {
          const group = groups.find((g) => g.id === gid);
          (group?.members ?? []).forEach((m) => { if (m.user_id !== 'me') memberIds.add(m.user_id); });
        });
        return base.map((f) => ({ ...f, selected: memberIds.has(f.id) }));
      }
      return base;
    })()
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(preselectedGroupIds?.[0] ?? null);
  const [step, setStep] = useState<'details' | 'people' | 'confirm'>(isFromEvent || !!preselectedGroupIds?.length ? 'people' : 'details');

  const toggleFriend = (id: string) => {
    setFriends((prev) => prev.map((f) => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const selectGroup = (groupId: string) => {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
      setFriends((prev) => prev.map((f) => ({ ...f, selected: false })));
    } else {
      setSelectedGroupId(groupId);
      const group = groups.find((g) => g.id === groupId);
      const memberIds = new Set((group?.members ?? []).map((m) => m.user_id));
      setFriends((prev) => prev.map((f) => ({ ...f, selected: memberIds.has(f.id) })));
    }
  };

  const selectedCount = friends.filter((f) => f.selected).length;

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    const selectedFriendIds = friends.filter((f) => f.selected).map((f) => f.id);
    if (1 + selectedFriendIds.length > MAX_PARTICIPANTS) {
      Alert.alert('Слишком много участников', `Максимум ${MAX_PARTICIPANTS} участников, включая вас`);
      return;
    }
    const participants = friends.filter((f) => f.selected).map((f) => ({
      id: `pp-${Date.now()}-${f.id}`, plan_id: '', user_id: f.id,
      status: 'invited' as const, joined_at: new Date().toISOString(),
      user: mockUsers.find((u) => u.id === f.id),
    }));
    const planId = `plan-${Date.now()}`;
    const plan: Plan = {
      id: planId, creator_id: user.id, title: title.trim(), activity_type: activityType,
      linked_event_id: linkedEventId ?? null, place_status: placeText.trim() ? 'confirmed' : 'undecided',
      time_status: timeText.trim() ? 'confirmed' : 'undecided',
      confirmed_place_text: placeText.trim() || null, confirmed_place_lat: null, confirmed_place_lng: null,
      confirmed_time: timeText.trim() || null, lifecycle_state: 'active',
      pre_meet_enabled: preMeetEnabled, pre_meet_place_text: preMeetEnabled ? preMeetPlace.trim() || null : null,
      pre_meet_time: preMeetEnabled ? preMeetTime.trim() || null : null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      participants: [{ id: `pp-me-${Date.now()}`, plan_id: '', user_id: user.id, status: 'going', joined_at: new Date().toISOString(), user }, ...participants],
      proposals: [],
    };
    addPlan(plan);
    selectedFriendIds.forEach((friendId) => { addInvitation('plan', planId, user.id, friendId); });
    try {
      const apiPlanId = await apiCreatePlan({
        title: title.trim(), activity_type: activityType, linked_event_id: linkedEventId ?? undefined,
        confirmed_place_text: placeText.trim() || undefined, confirmed_time: timeText.trim() || undefined,
        pre_meet_enabled: preMeetEnabled, pre_meet_place_text: preMeetEnabled ? preMeetPlace.trim() || undefined : undefined,
        pre_meet_time: preMeetEnabled ? preMeetTime.trim() || undefined : undefined, participant_ids: selectedFriendIds,
      });
      onDone(apiPlanId || planId);
    } catch { onDone(planId); }
  };

  const activities: ActivityType[] = ['cinema', 'coffee', 'bar', 'walk', 'dinner', 'sport', 'exhibition', 'other'];

  return (
    <ScreenContainer>
      <View style={s.container}>
        <FadeIn>
          <View style={s.stepRow}>
            {['details', 'people', 'confirm'].map((sKey, i) => {
              const labels = ['Детали', 'Люди', 'Готово'];
              const isActive = step === sKey || (step === 'people' && i === 0 && isFromEvent);
              const isPast = (step === 'people' && sKey === 'details') || (step === 'confirm' && (sKey === 'details' || sKey === 'people'));
              return (
                <AnimatedChip key={sKey} label={labels[i]} active={isActive || isPast} onPress={() => {
                  if (sKey === 'details' && !isFromEvent) setStep('details');
                  if (sKey === 'people') setStep('people');
                  if (sKey === 'confirm' && selectedCount > 0) setStep('confirm');
                }} />
              );
            })}
          </View>
        </FadeIn>

        {step === 'details' && (
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
            {isFromEvent && (
              <GlassCard animated={false} style={s.linkedBanner}>
                <View style={s.linkedRow}>
                  <Ionicons name="link" size={14} color={theme.colors.primary} />
                  <Text style={s.linkedText}>{linkedEventTitle}</Text>
                </View>
              </GlassCard>
            )}
            <Text style={s.label}>Тип активности</Text>
            <View style={s.activityGrid}>
              {activities.map((act) => (
                <AnimatedChip key={act} label={ACTIVITY_LABELS[act]} active={activityType === act} onPress={() => setActivityType(act)} />
              ))}
            </View>
            <Text style={s.label}>Название плана</Text>
            <View style={s.inputGroup}>
              <Ionicons name="text" size={16} color={theme.colors.textTertiary} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Кино в субботу" placeholderTextColor={theme.colors.textTertiary} value={title} onChangeText={setTitle} />
            </View>
            <Text style={s.label}>Место {isFromEvent && <Text style={s.hint}>(из мероприятия)</Text>}</Text>
            <View style={s.inputGroup}>
              <Ionicons name="location" size={16} color={theme.colors.textTertiary} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Решим позже..." placeholderTextColor={theme.colors.textTertiary} value={placeText} onChangeText={setPlaceText} editable={!isFromEvent} />
            </View>
            <Text style={s.label}>Время {isFromEvent && <Text style={s.hint}>(из мероприятия)</Text>}</Text>
            <View style={s.inputGroup}>
              <Ionicons name="time" size={16} color={theme.colors.textTertiary} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Обсудим..." placeholderTextColor={theme.colors.textTertiary} value={timeText} onChangeText={setTimeText} editable={!isFromEvent} />
            </View>
            <View style={s.switchRow}>
              <Text style={s.label}>Встретиться до мероприятия</Text>
              <Switch value={preMeetEnabled} onValueChange={setPreMeetEnabled} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} thumbColor={preMeetEnabled ? '#fff' : theme.colors.surface} />
            </View>
            {preMeetEnabled && (
              <FadeIn>
                <View style={s.inputGroup}>
                  <Ionicons name="location" size={16} color={theme.colors.textTertiary} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="Место встречи" placeholderTextColor={theme.colors.textTertiary} value={preMeetPlace} onChangeText={setPreMeetPlace} />
                </View>
                <View style={s.inputGroup}>
                  <Ionicons name="time" size={16} color={theme.colors.textTertiary} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="Время встречи" placeholderTextColor={theme.colors.textTertiary} value={preMeetTime} onChangeText={setPreMeetTime} />
                </View>
              </FadeIn>
            )}
            <PressableScale onPress={() => setStep('people')}>
              <View style={s.nextBtn}>
                <Text style={s.nextBtnText}>Далее</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </PressableScale>
          </ScrollView>
        )}

        {step === 'people' && (
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
            {groups.length > 0 && (
              <FadeIn>
                <Text style={s.label}>Группы</Text>
                {groups.map((g) => (
                  <PressableScale key={g.id} onPress={() => selectGroup(g.id)}>
                    <GlassCard animated={false} style={[s.groupCard, selectedGroupId === g.id && s.groupCardActive]}>
                      <View style={s.groupRow}>
                        <View style={s.groupAvatar}>
                          <Ionicons name="people" size={16} color={selectedGroupId === g.id ? '#fff' : theme.colors.primary} />
                        </View>
                        <View style={s.groupInfo}>
                          <Text style={[s.groupName, selectedGroupId === g.id && s.groupNameActive]}>{g.name}</Text>
                          <Text style={s.groupMeta}>{g.members?.length ?? 0} чел.</Text>
                        </View>
                        {selectedGroupId === g.id && <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />}
                      </View>
                    </GlassCard>
                  </PressableScale>
                ))}
                <View style={s.divider} />
              </FadeIn>
            )}
            <Text style={s.label}>Друзья {selectedCount > 0 && <Text style={s.selectedCount}>({selectedCount})</Text>}</Text>
            {friends.map((f, i) => (
              <FadeIn key={f.id} delay={i * 30}>
                <PressableScale onPress={() => toggleFriend(f.id)}>
                  <View style={[s.friendRow, f.selected && s.friendRowActive]}>
                    <View style={s.friendAvatar}><Text style={s.friendLetter}>{f.name[0]}</Text></View>
                    <Text style={[s.friendName, f.selected && s.friendNameActive]}>{f.name}</Text>
                    {f.selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={theme.colors.border} />
                    )}
                  </View>
                </PressableScale>
              </FadeIn>
            ))}
            <PressableScale onPress={() => selectedCount > 0 ? setStep('confirm') : null}>
              <View style={[s.nextBtn, selectedCount === 0 && s.nextBtnDisabled]}>
                <Text style={[s.nextBtnText, selectedCount === 0 && s.nextBtnTextDisabled]}>Далее</Text>
                <Ionicons name="arrow-forward" size={18} color={selectedCount === 0 ? 'rgba(255,255,255,0.4)' : '#fff'} />
              </View>
            </PressableScale>
          </ScrollView>
        )}

        {step === 'confirm' && (
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
            <GlassCard animated={false} style={s.summaryCard}>
              <Text style={s.summaryTitle}>{title || 'Без названия'}</Text>
              <View style={s.summaryRow}>
                <Ionicons name="pricetag" size={14} color={theme.colors.primary} />
                <Text style={s.summaryMeta}>{ACTIVITY_LABELS[activityType]}</Text>
              </View>
              {placeText ? (
                <View style={s.summaryRow}>
                  <Ionicons name="location" size={14} color={theme.colors.primary} />
                  <Text style={s.summaryMeta}>{placeText}</Text>
                </View>
              ) : <Text style={s.summaryMetaMuted}>Место не указано</Text>}
              {timeText ? (
                <View style={s.summaryRow}>
                  <Ionicons name="time" size={14} color={theme.colors.primary} />
                  <Text style={s.summaryMeta}>{timeText}</Text>
                </View>
              ) : <Text style={s.summaryMetaMuted}>Время не указано</Text>}
              {preMeetEnabled && (
                <View style={s.summaryRow}>
                  <Ionicons name="cafe" size={14} color={theme.colors.cta} />
                  <Text style={s.summaryMeta}>Встреча до: {preMeetPlace}{preMeetPlace && preMeetTime ? ', ' : ''}{preMeetTime}</Text>
                </View>
              )}
            </GlassCard>

            <Text style={s.label}>Приглашены ({selectedCount})</Text>
            {friends.filter((f) => f.selected).map((f, i) => (
              <FadeIn key={f.id} delay={i * 30}>
                <View style={s.friendRow}>
                  <View style={s.friendAvatar}><Text style={s.friendLetter}>{f.name[0]}</Text></View>
                  <Text style={s.friendName}>{f.name}</Text>
                </View>
              </FadeIn>
            ))}

            <PressableScale onPress={handleCreate}>
              <View style={s.createBtn}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={s.createBtnText}>Создать план</Text>
              </View>
            </PressableScale>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.md, ...Platform.select({ web: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm } }) },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, ...Platform.select({ web: { paddingBottom: theme.spacing.xxl } }) },
  linkedBanner: { marginBottom: theme.spacing.lg },
  linkedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkedText: { ...theme.typography.caption, color: theme.colors.primary },
  label: { ...theme.typography.h4, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md, ...Platform.select({ web: { marginTop: theme.spacing.sm } }) },
  hint: { ...theme.typography.caption, color: theme.colors.textTertiary, fontWeight: '400' },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md, ...theme.shadows.sm },
  inputIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, paddingVertical: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }), fontSize: 16, color: theme.colors.textPrimary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: theme.spacing.md },
  groupCard: { marginBottom: theme.spacing.sm },
  groupCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' },
  groupRow: { flexDirection: 'row', alignItems: 'center' },
  groupAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  groupInfo: { flex: 1 },
  groupName: { ...theme.typography.bodyBold, color: theme.colors.textPrimary },
  groupNameActive: { color: theme.colors.primary },
  groupMeta: { ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: theme.spacing.lg },
  selectedCount: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
  friendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.borderLight, ...Platform.select({ web: { paddingVertical: theme.spacing.sm } }) },
  friendRowActive: { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '30' },
  friendAvatar: { width: Platform.select({ web: 32, default: 40 }), height: Platform.select({ web: 32, default: 40 }), borderRadius: Platform.select({ web: 16, default: 20 }), backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  friendLetter: { fontSize: Platform.select({ web: 14, default: 18 }), fontWeight: '700', color: theme.colors.primary },
  friendName: { ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 },
  friendNameActive: { color: theme.colors.primary, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, paddingVertical: theme.spacing.lg, marginTop: theme.spacing.xl, ...theme.shadows.glow, ...Platform.select({ web: { paddingVertical: theme.spacing.md, marginTop: theme.spacing.lg } }) },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 16 },
  nextBtnTextDisabled: { opacity: 0.4 },
  summaryCard: { marginBottom: theme.spacing.lg },
  summaryTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs },
  summaryMeta: { ...theme.typography.caption, color: theme.colors.textSecondary },
  summaryMetaMuted: { ...theme.typography.caption, color: theme.colors.textTertiary, fontStyle: 'italic', marginBottom: theme.spacing.xs },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.success, borderRadius: theme.borderRadius.lg, paddingVertical: theme.spacing.xl, marginTop: theme.spacing.xl, ...theme.shadows.md, ...Platform.select({ web: { paddingVertical: theme.spacing.lg } }) },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 18, ...Platform.select({ web: { fontSize: 16 } }) },
});
