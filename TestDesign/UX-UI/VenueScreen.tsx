import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateShort } from '../utils/dates';
import { CATEGORY_LABELS } from '../utils/constants';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, GlassCard, PressableScale } from '../components/Animations';
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
          <View style={s.backCircle}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Image source={{ uri: venue.cover_image_url }} style={s.cover} />
        <View style={s.body}>
          <FadeIn>
            <Text style={s.name}>{venue.name}</Text>
            <View style={s.metaRow}>
              <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
              <Text style={s.address}>{venue.address}</Text>
            </View>
            <Text style={s.description}>{venue.description}</Text>
          </FadeIn>

          <FadeIn delay={100}>
            <View style={s.sectionHeader}>
              <Ionicons name="calendar" size={16} color={theme.colors.primary} />
              <Text style={s.sectionTitle}>Мероприятия ({venueEvents.length})</Text>
            </View>
          </FadeIn>

          {venueEvents.map((e, i) => (
            <FadeIn key={e.id} delay={150 + i * theme.anim.timing.stagger}>
              <GlassCard animated={false}>
                <TouchableOpacity style={s.eventCard} onPress={() => navigation.navigate('EventDetails', { eventId: e.id })} activeOpacity={0.85}>
                  <Image source={{ uri: e.cover_image_url }} style={s.eventImage} />
                  <View style={s.eventBody}>
                    <Text style={s.eventTitle} numberOfLines={1}>{e.title}</Text>
                    <View style={s.metaRow}>
                      <Ionicons name="pricetag" size={11} color={theme.colors.textTertiary} />
                      <Text style={s.eventMeta}>{CATEGORY_LABELS[e.category] ?? ''} · {formatDateShort(e.starts_at)}</Text>
                    </View>
                    {e.price_info && <Text style={s.eventMeta}>{e.price_info}</Text>}
                  </View>
                </TouchableOpacity>
              </GlassCard>
            </FadeIn>
          ))}
          {venueEvents.length === 0 && <Text style={s.emptyList}>Нет предстоящих мероприятий</Text>}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: theme.spacing.xxxl, ...Platform.select({ web: { paddingBottom: theme.spacing.xxl } }) },
  backBtn: { position: 'absolute', top: Platform.select({ web: 12, default: 48 }), left: theme.spacing.md, zIndex: 10 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', ...theme.shadows.sm },
  cover: { width: '100%', height: Platform.select({ web: 160, default: 200 }), aspectRatio: Platform.select({ web: 16 / 7, default: undefined }) },
  body: { padding: theme.spacing.lg, marginTop: -16, backgroundColor: theme.colors.background, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl },
  name: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs, ...Platform.select({ web: { ...theme.typography.h3 } }) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs },
  address: { ...theme.typography.caption, color: theme.colors.textSecondary },
  description: { ...theme.typography.body, color: theme.colors.textPrimary, lineHeight: 22, marginBottom: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  sectionTitle: { ...theme.typography.h4, color: theme.colors.textPrimary },
  eventCard: { flexDirection: 'row' },
  eventImage: { width: Platform.select({ web: 64, default: 80 }), height: Platform.select({ web: 64, default: 80 }), borderTopLeftRadius: theme.borderRadius.lg, borderBottomLeftRadius: theme.borderRadius.lg },
  eventBody: { flex: 1, padding: Platform.select({ web: theme.spacing.sm, default: theme.spacing.md }), justifyContent: 'center' },
  eventTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 4 },
  eventMeta: { ...theme.typography.small, color: theme.colors.textTertiary },
  empty: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 100 },
  emptyList: { ...theme.typography.caption, color: theme.colors.textTertiary, textAlign: 'center', marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
});
