import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateFull } from '../utils/dates';
import { CATEGORY_LABELS } from '../utils/constants';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventDetails'>;

export const EventDetailsScreen = ({ route, navigation }: Props) => {
  const { eventId } = route.params;
  const { events, interestedIds, savedIds, toggleInterest, toggleSave } = useEventsStore();
  const event = events.find((e) => e.id === eventId);

  if (!event) return <ScreenContainer><View style={s.inner}><Text style={s.empty}>Мероприятие не найдено</Text></View></ScreenContainer>;

  const isInterested = interestedIds.has(event.id);
  const isSaved = savedIds.has(event.id);

  return (
    <ScreenContainer>
      <ScrollView style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <Image source={{ uri: event.cover_image_url }} style={s.hero} />
        <View style={s.body}>
          <Text style={s.category}>{CATEGORY_LABELS[event.category] ?? event.category}</Text>
          <Text style={s.title}>{event.title}</Text>
          <Text style={s.venue}>{event.venue?.name}</Text>
          <Text style={s.meta}>{formatDateFull(event.starts_at)}</Text>
          {event.venue && <TouchableOpacity onPress={() => navigation.navigate('VenueDetails', { venueId: event.venue!.id })}><Text style={s.venueLink}>{event.venue.address} →</Text></TouchableOpacity>}
          {event.price_info && <Text style={s.meta}>{event.price_info}</Text>}

          {event.friendsInterested && event.friendsInterested.length > 0 && (
            <View style={s.proof}>
              <Text style={s.proofText}>{event.friendsInterested.map((f) => f.name).join(', ')} интересуются</Text>
            </View>
          )}

          <View style={s.divider} />
          <Text style={s.description}>{event.description}</Text>
          <View style={{ height: 80 }} />
        </View>

        <View style={s.bottomBar}>
          <TouchableOpacity style={[s.actionBtn, isInterested && s.actionActive]} onPress={() => toggleInterest(event.id)}>
            <Text style={[s.actionText, isInterested && s.actionTextActive]}>интересно</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleSave(event.id)}>
            <Text style={s.saveIcon}>{isSaved ? '★' : '☆'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.planBtn} onPress={() => navigation.navigate('CreatePlanFromEvent', { eventId: event.id })}>
            <Text style={s.planBtnText}>Планы?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  backBtn: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.sm },
  backText: { ...theme.typography.body, color: theme.colors.primary },
  hero: { width: '100%', height: Platform.select({ web: 200, default: 260 }), aspectRatio: Platform.select({ web: 16 / 8, default: undefined }) },
  body: { padding: theme.spacing.lg, ...Platform.select({ web: { paddingVertical: theme.spacing.md } }) },
  category: { ...theme.typography.captionBold, color: theme.colors.primary, marginBottom: theme.spacing.sm },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  venue: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
  meta: { ...theme.typography.caption, color: theme.colors.textTertiary, marginBottom: theme.spacing.xs },
  venueLink: { ...theme.typography.caption, color: theme.colors.primary, marginBottom: theme.spacing.xs },
  proof: { backgroundColor: theme.colors.primaryLight + '15', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginTop: theme.spacing.md },
  proofText: { ...theme.typography.caption, color: theme.colors.primary },
  divider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: theme.spacing.lg },
  description: { ...theme.typography.body, color: theme.colors.textPrimary, lineHeight: 22 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, backgroundColor: theme.colors.surface, gap: theme.spacing.md },
  actionBtn: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  actionActive: { backgroundColor: theme.colors.primaryLight + '22', borderColor: theme.colors.primaryLight },
  actionText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  actionTextActive: { color: theme.colors.primary, fontWeight: '600' },
  saveIcon: { fontSize: 24, color: theme.colors.textTertiary, paddingHorizontal: theme.spacing.sm },
  planBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.md, marginLeft: 'auto' },
  planBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 16 },
  empty: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 100 },
});
