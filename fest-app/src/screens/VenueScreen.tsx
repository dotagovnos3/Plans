import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateShort } from '../utils/dates';
import { CATEGORY_LABELS } from '../utils/constants';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'VenueDetails'>;

export const VenueScreen = ({ route, navigation }: Props) => {
  const { venueId } = route.params;
  const { events } = useEventsStore();
  const venueEvents = events.filter((e) => e.venue_id === venueId);
  const venue = venueEvents[0]?.venue;

  if (!venue) return <ScreenContainer><View style={s.inner}><Text style={s.empty}>Площадка не найдена</Text></View></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView style={s.inner} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <Image source={{ uri: venue.cover_image_url }} style={s.cover} />
        <Text style={s.name}>{venue.name}</Text>
        <Text style={s.address}>{venue.address}</Text>
        <Text style={s.description}>{venue.description}</Text>

        <Text style={s.sectionTitle}>Мероприятия ({venueEvents.length})</Text>
        {venueEvents.map((e) => (
          <TouchableOpacity key={e.id} style={s.eventCard} onPress={() => navigation.navigate('EventDetails', { eventId: e.id })} activeOpacity={0.7}>
            <Image source={{ uri: e.cover_image_url }} style={s.eventImage} />
            <View style={s.eventBody}>
              <Text style={s.eventTitle} numberOfLines={1}>{e.title}</Text>
              <Text style={s.eventMeta}>{CATEGORY_LABELS[e.category] ?? ''} · {formatDateShort(e.starts_at)}</Text>
              {e.price_info && <Text style={s.eventMeta}>{e.price_info}</Text>}
            </View>
          </TouchableOpacity>
        ))}
        {venueEvents.length === 0 && <Text style={s.emptyList}>Нет предстоящих мероприятий</Text>}
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: theme.spacing.xxxl, ...Platform.select({ web: { paddingBottom: theme.spacing.xxl } }) },
  backBtn: { paddingHorizontal: theme.spacing.lg, paddingTop: Platform.select({ web: theme.spacing.lg, default: theme.spacing.xl }), paddingBottom: theme.spacing.sm },
  backText: { ...theme.typography.body, color: theme.colors.primary },
  cover: { width: '100%', height: Platform.select({ web: 160, default: 200 }), aspectRatio: Platform.select({ web: 16 / 7, default: undefined }) },
  name: { ...theme.typography.h2, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, marginBottom: theme.spacing.xs, ...Platform.select({ web: { paddingTop: theme.spacing.md, ...theme.typography.h3 } }) },
  address: { ...theme.typography.caption, color: theme.colors.textSecondary, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  description: { ...theme.typography.body, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.lg, lineHeight: 22, marginBottom: theme.spacing.lg },
  sectionTitle: { ...theme.typography.h4, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  eventCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm, overflow: 'hidden', ...theme.shadows.sm },
  eventImage: { width: Platform.select({ web: 64, default: 80 }), height: Platform.select({ web: 64, default: 80 }) },
  eventBody: { flex: 1, padding: Platform.select({ web: theme.spacing.sm, default: theme.spacing.md }), justifyContent: 'center' },
  eventTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 2 },
  eventMeta: { ...theme.typography.small, color: theme.colors.textTertiary },
  empty: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 100 },
  emptyList: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
});
