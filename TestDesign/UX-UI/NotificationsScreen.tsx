import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useNotificationsStore } from '../stores/notificationsStore';
import { formatTimeAgo } from '../utils/dates';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, GlassCard, PressableScale, Pulse } from '../components/Animations';
import type { RootStackParamList } from '../navigation/types';
import type { NotificationType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const TYPE_LABELS: Record<NotificationType, string> = {
  plan_invite: 'Приглашение в план',
  group_invite: 'Приглашение в группу',
  proposal_created: 'Новое предложение',
  plan_finalized: 'План подтверждён',
  plan_unfinalized: 'Подтверждение отменено',
  event_time_changed: 'Время мероприятия изменилось',
  event_cancelled: 'Мероприятие отменено',
  plan_reminder: 'Напоминание о плане',
  plan_completed: 'План завершён',
};

const TYPE_ICONS: Record<NotificationType, string> = {
  plan_invite: 'calendar',
  group_invite: 'people',
  proposal_created: 'chatbubble',
  plan_finalized: 'checkmark-done',
  plan_unfinalized: 'refresh',
  event_time_changed: 'time',
  event_cancelled: 'close-circle',
  plan_reminder: 'notifications',
  plan_completed: 'trophy',
};

const PLAN_TYPES: NotificationType[] = ['plan_invite', 'proposal_created', 'plan_finalized', 'plan_unfinalized', 'plan_reminder', 'plan_completed'];
const GROUP_TYPES: NotificationType[] = ['group_invite'];
const EVENT_TYPES: NotificationType[] = ['event_time_changed', 'event_cancelled'];

export const NotificationsScreen = ({ navigation }: Props) => {
  const { notifications, markRead, markAllRead, unreadCount, fetchNotifications } = useNotificationsStore();

  React.useEffect(() => { fetchNotifications(); }, []);

  const handleTap = (item: typeof notifications[0]) => {
    markRead(item.id);
    const payload = item.payload;
    if (PLAN_TYPES.includes(item.type) && payload.plan_id) {
      (navigation as any).navigate('PlansTab', { screen: 'PlanDetails', params: { planId: payload.plan_id as string } });
    } else if (GROUP_TYPES.includes(item.type) && payload.group_id) {
      (navigation as any).navigate('PlansTab', { screen: 'GroupDetails', params: { groupId: payload.group_id as string } });
    } else if (EVENT_TYPES.includes(item.type) && payload.event_id) {
      (navigation as any).navigate('HomeTab', { screen: 'EventDetails', params: { eventId: payload.event_id as string } });
    }
  };

  const renderItem = ({ item, index }: { item: typeof notifications[0]; index: number }) => (
    <FadeIn delay={index * 40}>
      <GlassCard animated={false} style={[s.card, !item.read && s.cardUnread]}>
        <TouchableOpacity onPress={() => handleTap(item)} activeOpacity={0.85}>
          <View style={s.cardContent}>
            <View style={[s.iconCircle, !item.read && s.iconCircleUnread]}>
              <Ionicons name={TYPE_ICONS[item.type] as any} size={16} color={!item.read ? theme.colors.primary : theme.colors.textTertiary} />
            </View>
            <View style={s.cardTextCol}>
              <Text style={[s.typeLabel, !item.read && s.typeLabelUnread]}>{TYPE_LABELS[item.type]}</Text>
              {(item.payload as Record<string, string>).inviter_name && <Text style={s.payloadText}>от {(item.payload as Record<string, string>).inviter_name}</Text>}
              {(item.payload as Record<string, string>).proposer_name && <Text style={s.payloadText}>от {(item.payload as Record<string, string>).proposer_name}</Text>}
              {(item.payload as Record<string, string>).plan_title && <Text style={s.payloadText}>{(item.payload as Record<string, string>).plan_title}</Text>}
            </View>
            <Text style={s.time}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
      </GlassCard>
    </FadeIn>
  );

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <FadeIn>
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <View style={s.backCircle}>
                <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
              </View>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Уведомления</Text>
            {unreadCount > 0 && (
              <PressableScale onPress={markAllRead}>
                <View style={s.markAllBtn}>
                  <Ionicons name="checkmark-done" size={14} color={theme.colors.primary} />
                  <Text style={s.markAll}>Прочитать все</Text>
                </View>
              </PressableScale>
            )}
          </View>
        </FadeIn>
        <FlatList data={notifications} keyExtractor={(n) => n.id} renderItem={renderItem} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Нет уведомлений" />} showsVerticalScrollIndicator={false} />
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingTop: Platform.select({ web: theme.spacing.lg, default: theme.spacing.xl }), paddingBottom: theme.spacing.md },
  headerTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, flex: 1, marginLeft: theme.spacing.md },
  backCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', ...theme.shadows.sm },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAll: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.sm },
  card: { padding: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }) },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconCircleUnread: { backgroundColor: theme.colors.primary + '15' },
  cardTextCol: { flex: 1 },
  typeLabel: { ...theme.typography.bodyBold, color: theme.colors.textSecondary, marginBottom: 2 },
  typeLabelUnread: { color: theme.colors.textPrimary },
  payloadText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  time: { ...theme.typography.small, color: theme.colors.textTertiary },
});
