import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateFull } from '../utils/dates';
import { CATEGORY_LABELS } from '../utils/constants';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, PressableScale, GlassCard } from '../components/Animations';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventDetails'>;

export const EventDetailsScreen = ({ route, navigation }: Props) => {
  const { eventId } = route.params;
  const { events, interestedIds, savedIds, toggleInterest, toggleSave } = useEventsStore();
  const event = events.find((e) => e.id === eventId);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const heroScale = scrollY.interpolate({ inputRange: [-100, 0, 100], outputRange: [1.15, 1, 0.9], extrapolate: 'clamp' });
  const heroOpacity = scrollY.interpolate({ inputRange: [-50, 0, 150], outputRange: [1, 1, 0.3], extrapolate: 'clamp' });

  if (!event) return <ScreenContainer><View style={s.inner}><Text style={s.empty}>Мероприятие не найдено</Text></View></ScreenContainer>;

  const isInterested = interestedIds.has(event.id);
  const isSaved = savedIds.has(event.id);

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <Animated.ScrollView
          style={s.scroll}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        >
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <View style={s.backCircle}>
              <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
            </View>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: heroScale }], opacity: heroOpacity }}>
            <Image source={{ uri: event.cover_image_url }} style={s.hero} />
            <View style={s.heroGradient} />
          </Animated.View>

          <View style={s.body}>
            <FadeIn delay={100}>
              <View style={s.categoryBadge}>
                <Text style={s.categoryText}>{CATEGORY_LABELS[event.category] ?? event.category}</Text>
              </View>
              <Text style={s.title}>{event.title}</Text>
              <View style={s.metaRow}>
                <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
                <Text style={s.venue}>{event.venue?.name}</Text>
              </View>
              <View style={s.metaRow}>
                <Ionicons name="time" size={14} color={theme.colors.textSecondary} />
                <Text style={s.meta}>{formatDateFull(event.starts_at)}</Text>
              </View>
              {event.venue && (
                <TouchableOpacity onPress={() => navigation.navigate('VenueDetails', { venueId: event.venue!.id })}>
                  <View style={s.metaRow}>
                    <Ionicons name="navigate" size={14} color={theme.colors.primary} />
                    <Text style={s.venueLink}>{event.venue.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {event.price_info && (
                <View style={s.metaRow}>
                  <Ionicons name="pricetag" size={14} color={theme.colors.cta} />
                  <Text style={s.meta}>{event.price_info}</Text>
                </View>
              )}

              {event.friendsInterested && event.friendsInterested.length > 0 && (
                <GlassCard animated={false} style={s.proof}>
                  <View style={s.proofRow}>
                    <Ionicons name="people" size={16} color={theme.colors.primary} />
                    <Text style={s.proofText}>{event.friendsInterested.map((f) => f.name).join(', ')} интересуются</Text>
                  </View>
                </GlassCard>
              )}

              <View style={s.divider} />
              <Text style={s.description}>{event.description}</Text>
              <View style={{ height: 90 }} />
            </FadeIn>
          </View>
        </Animated.ScrollView>

        <FadeIn delay={400}>
          <View style={s.bottomBar}>
            <PressableScale onPress={() => toggleInterest(event.id)}>
              <View style={[s.actionBtn, isInterested && s.actionActive]}>
                <Ionicons name={isInterested ? 'heart' : 'heart-outline'} size={18} color={isInterested ? theme.colors.accent : theme.colors.textSecondary} />
                <Text style={[s.actionText, isInterested && s.actionTextActive]}>интересно</Text>
              </View>
            </PressableScale>
            <PressableScale onPress={() => toggleSave(event.id)}>
              <View style={s.saveBtn}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? theme.colors.cta : theme.colors.textTertiary} />
              </View>
            </PressableScale>
            <PressableScale onPress={() => navigation.navigate('CreatePlanFromEvent', { eventId: event.id })}>
              <View style={s.planBtn}>
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <Text style={s.planBtnText}>Планы?</Text>
              </View>
            </PressableScale>
          </View>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  backBtn: { position: 'absolute', top: Platform.select({ web: 12, default: 48 }), left: theme.spacing.md, zIndex: 10 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', ...theme.shadows.sm },
  hero: { width: '100%', height: Platform.select({ web: 220, default: 280 }) },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(248,247,255,0.8)' },
  body: { padding: theme.spacing.lg, ...Platform.select({ web: { paddingVertical: theme.spacing.md } }), marginTop: -20, backgroundColor: theme.colors.background, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl },
  categoryBadge: { backgroundColor: theme.colors.primary + '15', borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, alignSelf: 'flex-start', marginBottom: theme.spacing.md },
  categoryText: { ...theme.typography.captionBold, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs },
  venue: { ...theme.typography.body, color: theme.colors.textSecondary },
  meta: { ...theme.typography.caption, color: theme.colors.textSecondary },
  venueLink: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '500' },
  proof: { marginTop: theme.spacing.md, borderRadius: theme.borderRadius.md },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  proofText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: theme.spacing.lg },
  description: { ...theme.typography.body, color: theme.colors.textPrimary, lineHeight: 22 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: Platform.select({ web: theme.spacing.sm, default: theme.spacing.md }), borderTopWidth: 1, borderTopColor: theme.colors.borderLight, backgroundColor: theme.colors.surface, gap: theme.spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  actionActive: { backgroundColor: theme.colors.accent + '18', borderColor: theme.colors.accent },
  actionText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  actionTextActive: { color: theme.colors.accent, fontWeight: '600' },
  saveBtn: { padding: theme.spacing.sm },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.md, marginLeft: 'auto', ...theme.shadows.glow },
  planBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 15 },
  empty: { ...theme.typography.body, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 100 },
});
