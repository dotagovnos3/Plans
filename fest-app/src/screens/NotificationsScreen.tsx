import React from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useNotificationsStore } from '../stores/notificationsStore';
import { formatTimeAgo } from '../utils/dates';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackParamList } from '../navigation/types';
import type { NotificationType } from '../types';
import { AnimatedPressable } from '../fest-animations/AnimatedPressable';
import { SpringFadeIn } from '../fest-animations/SpringFadeIn';
import { StaggeredList } from '../fest-animations/StaggeredList';

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
  plan_invite: '✉️',
  group_invite: '👥',
  proposal_created: '💡',
  plan_finalized: '✅',
  plan_unfinalized: '↩️',
  event_time_changed: '🕐',
  event_cancelled: '❌',
  plan_reminder: '⏰',
  plan_completed: '🎉',
};

const PLAN_TYPES: NotificationType[] = ['plan_invite', 'proposal_created', 'plan_finalized', 'plan_unfinalized', 'plan_reminder', 'plan_completed'];
const GROUP_TYPES: NotificationType[] = ['group_invite'];
const EVENT_TYPES: NotificationType[] = ['event_time_changed', 'event_cancelled'];

export const NotificationsScreen = ({ navigation }: Props) => {
  const { notifications, markRead, markAllRead, unreadCount, loading, error, fetchNotifications } = useNotificationsStore();

  React.useEffect(() => { fetchNotifications(); }, []);

  const handleTap = (item: typeof notifications[0]) => {
    markRead(item.id);
    const payload = item.payload;
    if (PLAN_TYPES.includes(item.type) && payload.plan_id) {
      (navigation as any).navigate('PlansTab', {
        screen: 'PlanDetails',
        params: { planId: payload.plan_id as string },
      });
    } else if (GROUP_TYPES.includes(item.type) && payload.group_id) {
      (navigation as any).navigate('PlansTab', {
        screen: 'GroupDetails',
        params: { groupId: payload.group_id as string },
      });
    } else if (EVENT_TYPES.includes(item.type) && payload.event_id) {
      (navigation as any).navigate('HomeTab', {
        screen: 'EventDetails',
        params: { eventId: payload.event_id as string },
      });
    }
  };

  const renderItem = ({ item }: { item: typeof notifications[0] }) => {
    const payload = item.payload as Record<string, string>;
    return (
      <AnimatedPressable
        style={[s.card, !item.read && s.cardUnread]}
        onPress={() => handleTap(item)}
        activeScale={0.98}
      >
        <View style={s.cardContent}>
          <View style={s.iconWrap}>
            <Text style={s.icon}>{TYPE_ICONS[item.type]}</Text>
          </View>
          <View style={s.cardTextCol}>
            <View style={s.cardHeader}>
              <Text style={s.typeLabel} numberOfLines={1}>{TYPE_LABELS[item.type]}</Text>
              {!item.read ? <View style={s.unreadDot} /> : null}
            </View>
            {payload.inviter_name ? <Text style={s.payloadText}>от {payload.inviter_name}</Text> : null}
            {payload.proposer_name ? <Text style={s.payloadText}>от {payload.proposer_name}</Text> : null}
            {payload.plan_title ? <Text style={s.payloadText}>{payload.plan_title}</Text> : null}
            <Text style={s.time}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <SpringFadeIn delay={60} direction="down" distance={14}>
          <View style={s.header}>
            <AnimatedPressable onPress={() => navigation.goBack()} activeScale={0.92} hitSlop={12}>
              <Text style={s.backText}>← Назад</Text>
            </AnimatedPressable>
            <Text style={s.headerTitle}>Уведомления</Text>
            {unreadCount > 0 ? (
              <AnimatedPressable onPress={markAllRead} activeScale={0.92} hitSlop={8}>
                <Text style={s.markAll}>Прочитать все</Text>
              </AnimatedPressable>
            ) : (
              <View style={s.markAllPlaceholder} />
            )}
          </View>
        </SpringFadeIn>

        {error ? <Text style={s.errorBanner}>{error}</Text> : null}

        {loading && notifications.length === 0 ? (
          <View style={s.loader}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        ) : (
          <StaggeredList
            data={notifications}
            keyExtractor={(n) => n.id}
            renderItem={renderItem}
            staggerDelay={40}
            baseDelay={120}
            animationType="slideUp"
            contentContainerStyle={s.list}
            refreshing={loading && notifications.length > 0}
            onRefresh={fetchNotifications}
            ListEmptyComponent={<EmptyState text="Нет уведомлений" />}
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
    paddingTop: Platform.select({ web: theme.spacing.lg, default: theme.spacing.xl }),
    paddingBottom: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.h4, color: theme.colors.textPrimary },
  backText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
  markAll: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
  markAllPlaceholder: { width: 80 },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }),
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  cardTextCol: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  typeLabel: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 2,
  },
  payloadText: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  time: { ...theme.typography.small, color: theme.colors.textTertiary, marginTop: theme.spacing.xs },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: { ...theme.typography.caption, color: theme.colors.error, textAlign: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.error + '11' },
});
