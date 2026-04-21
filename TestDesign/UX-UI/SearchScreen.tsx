import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { formatDateShort } from '../utils/dates';
import { CATEGORY_CHIPS, DISTRICTS } from '../utils/constants';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn, AnimatedChip, GlassCard, PressableScale } from '../components/Animations';
import type { Event, EventCategory } from '../types';

type DateFilter = null | 'today' | 'week' | 'weekend';

const DATE_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: null, label: 'Любая дата' },
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Эта неделя' },
  { key: 'weekend', label: 'Выходные' },
];

export const SearchScreen = () => {
  const { events } = useEventsStore();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<EventCategory | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);

  const filtered = events.filter((e) => {
    if (catFilter && e.category !== catFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const matches = e.title.toLowerCase().includes(q) || e.venue?.name.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (dateFilter) {
      const d = new Date(e.starts_at);
      const now = new Date();
      const dayOfWeek = d.getDay();
      if (dateFilter === 'today') {
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        if (d < weekStart || d >= weekEnd) return false;
      } else if (dateFilter === 'weekend') {
        if (dayOfWeek !== 0 && dayOfWeek !== 6) return false;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        if (d < weekStart || d >= weekEnd) return false;
      }
    }
    if (districtFilter && districtFilter !== 'Все') {
      const districts: Record<string, string[]> = {
        'Центр': ['Тверская', 'Патриаршие', 'Гоголя'],
        'Север': ['Лужники'],
        'Юг': [],
        'Запад': ['Кутузовский'],
        'Восток': [],
      };
      const allowed = districts[districtFilter] || [];
      const address = e.venue?.address ?? '';
      if (!allowed.some((a) => address.includes(a))) return false;
    }
    return true;
  });

  const goToEvent = (eventId: string) => {
    (navigation as any).navigate('HomeTab', { screen: 'EventDetails', params: { eventId } });
  };

  const renderItem = ({ item, index }: { item: Event; index: number }) => (
    <FadeIn delay={index * theme.anim.timing.stagger}>
      <GlassCard animated={false}>
        <TouchableOpacity style={s.resultCard} onPress={() => goToEvent(item.id)} activeOpacity={0.85}>
          <Image source={{ uri: item.cover_image_url }} style={s.resultImage} />
          <View style={s.resultBody}>
            <Text style={s.resultTitle} numberOfLines={1}>{item.title}</Text>
            <View style={s.metaRow}>
              <Ionicons name="location" size={11} color={theme.colors.textTertiary} />
              <Text style={s.resultVenue} numberOfLines={1}>{item.venue?.name}</Text>
            </View>
            <View style={s.metaRow}>
              <Ionicons name="time" size={11} color={theme.colors.textTertiary} />
              <Text style={s.resultMeta}>{formatDateShort(item.starts_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </GlassCard>
    </FadeIn>
  );

  return (
    <ScreenContainer>
      <View style={s.inner}>
        <FadeIn>
          <View style={s.searchRow}>
            <Ionicons name="search" size={18} color={theme.colors.textTertiary} style={s.searchIcon} />
            <TextInput style={s.searchInput} placeholder="Поиск мероприятий, мест..." placeholderTextColor={theme.colors.textTertiary} value={query} onChangeText={setQuery} />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={s.chipsRow}>
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATEGORY_CHIPS} keyExtractor={(c) => String(c.key ?? 'all')} renderItem={({ item: chip }) => (
              <AnimatedChip label={chip.label} active={catFilter === chip.key} onPress={() => setCatFilter(chip.key)} />
            )} />
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <View style={s.chipsRow}>
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={DATE_OPTIONS} keyExtractor={(d) => String(d.key ?? 'any')} renderItem={({ item }) => (
              <AnimatedChip label={item.label} active={dateFilter === item.key} onPress={() => setDateFilter(item.key)} />
            )} />
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <View style={s.chipsRow}>
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={DISTRICTS.map((d) => ({ key: d, label: d }))} keyExtractor={(d) => d.key} renderItem={({ item }) => (
              <AnimatedChip label={item.label} active={districtFilter === item.key} onPress={() => setDistrictFilter(item.key === 'Все' ? null : item.key)} />
            )} />
          </View>
        </FadeIn>

        <FadeIn delay={260}>
          <Text style={s.resultCount}>{filtered.length} мероприяти{filtered.length === 1 ? 'е' : filtered.length < 5 ? 'я' : 'й'}</Text>
        </FadeIn>

        <FlatList data={filtered} keyExtractor={(e) => e.id} renderItem={renderItem} contentContainerStyle={s.list} ListEmptyComponent={<EmptyState text="Ничего не найдено" />} showsVerticalScrollIndicator={false} />
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  inner: { flex: 1, backgroundColor: theme.colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, margin: theme.spacing.lg, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.lg, borderWidth: 1.5, borderColor: theme.colors.border, ...theme.shadows.sm },
  searchIcon: { marginRight: theme.spacing.sm },
  searchInput: { flex: 1, paddingVertical: Platform.select({ web: theme.spacing.sm, default: theme.spacing.md }), fontSize: 16, color: theme.colors.textPrimary },
  chipsRow: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xs },
  resultCount: { ...theme.typography.caption, color: theme.colors.textTertiary, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm, fontWeight: '500' },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.sm },
  resultCard: { flexDirection: 'row' },
  resultImage: { width: Platform.select({ web: 80, default: 100 }), height: Platform.select({ web: 72, default: 90 }), borderTopLeftRadius: theme.borderRadius.lg, borderBottomLeftRadius: theme.borderRadius.lg },
  resultBody: { flex: 1, padding: Platform.select({ web: theme.spacing.sm, default: theme.spacing.md }), justifyContent: 'center' },
  resultTitle: { ...theme.typography.bodyBold, color: theme.colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  resultVenue: { ...theme.typography.caption, color: theme.colors.textSecondary },
  resultMeta: { ...theme.typography.small, color: theme.colors.textTertiary },
});
