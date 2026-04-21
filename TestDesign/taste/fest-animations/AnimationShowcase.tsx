import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';

// Примеры использования всех анимационных компонентов
import {
  AnimatedPressable,
  AnimatedCard,
  AnimatedHeader,
  AnimatedChip,
  AnimatedTabs,
  AnimatedFloatingButton,
  AnimatedBadge,
  AnimatedNotificationBell,
  SpringFadeIn,
  GlassmorphismCard,
  BreathingGlow,
  AnimatedConfetti,
  AnimatedCounter,
  Skeleton,
  SkeletonCard,
} from './index';

export const AnimationShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('buttons');
  const [confettiTrigger, setConfettiTrigger] = React.useState(false);
  const [counter, setCounter] = React.useState(42);
  const [chips, setChips] = React.useState({
    all: true,
    music: false,
    art: false,
  });

  const tabs = [
    { key: 'buttons', label: 'Кнопки' },
    { key: 'cards', label: 'Карточки' },
    { key: 'feedback', label: 'Фидбек' },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Fest-Animations Demo</Text>
      <Text style={s.subtitle}>Wow-эффекты для fest-app</Text>

      {/* Confetti Trigger */}
      <AnimatedConfetti
        trigger={confettiTrigger}
        onComplete={() => setConfettiTrigger(false)}
      />

      {/* Section 1: Spring Buttons */}
      <SpringFadeIn delay={0}>
        <Text style={s.sectionTitle}>Spring Pressables</Text>
        <View style={s.row}>
          <AnimatedPressable
            onPress={() => {}}
            style={s.demoButton}
            activeScale={0.96}
          >
            <Text style={s.buttonText}>Primary</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setConfettiTrigger(true)}
            style={[s.demoButton, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={s.buttonText}>Confetti! 🎉</Text>
          </AnimatedPressable>
        </View>
      </SpringFadeIn>

      {/* Section 2: Staggered Cards */}
      <SpringFadeIn delay={100}>
        <Text style={s.sectionTitle}>Staggered Cards</Text>
        {[0, 1, 2].map((index) => (
          <AnimatedCard
            key={index}
            index={index}
            staggerDelay={80}
            enableHover
            enableSpotlight
            style={s.demoCard}
          >
            <Text style={s.cardTitle}>Карточка #{index + 1}</Text>
            <Text style={s.cardText}>
              Hover поднимает карточку, spotlight подсвечивает
            </Text>
          </AnimatedCard>
        ))}
      </SpringFadeIn>

      {/* Section 3: Animated Chips */}
      <SpringFadeIn delay={200}>
        <Text style={s.sectionTitle}>Animated Chips</Text>
        <View style={s.row}>
          {Object.entries(chips).map(([key, active], index) => (
            <AnimatedChip
              key={key}
              label={key.toUpperCase()}
              active={active}
              onPress={() => setChips(prev => ({ ...prev, [key]: !prev[key] }))}
              index={index}
            />
          ))}
        </View>
      </SpringFadeIn>

      {/* Section 4: Animated Tabs */}
      <SpringFadeIn delay={300}>
        <Text style={s.sectionTitle}>Animated Tabs</Text>
        <AnimatedTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </SpringFadeIn>

      {/* Section 5: Badges */}
      <SpringFadeIn delay={400}>
        <Text style={s.sectionTitle}>Badges with Pulse</Text>
        <View style={s.row}>
          <AnimatedBadge label="Иду" color={theme.colors.going} pulse />
          <AnimatedBadge label="Думаю" color={theme.colors.thinking} />
          <AnimatedBadge label="Не могу" color={theme.colors.cant} />
        </View>
      </SpringFadeIn>

      {/* Section 6: Notification Bell */}
      <SpringFadeIn delay={500}>
        <Text style={s.sectionTitle}>Notification Bell</Text>
        <View style={s.row}>
          <AnimatedNotificationBell
            count={5}
            onPress={() => {}}
          />
          <AnimatedPressable
            onPress={() => {}}
            style={s.smallButton}
          >
            <Text>+1</Text>
          </AnimatedPressable>
        </View>
      </SpringFadeIn>

      {/* Section 7: Animated Counter */}
      <SpringFadeIn delay={600}>
        <Text style={s.sectionTitle}>Animated Counter</Text>
        <View style={s.row}>
          <AnimatedCounter value={counter} style={s.counter} />
          <AnimatedPressable
            onPress={() => setCounter(c => c + 1)}
            style={s.smallButton}
          >
            <Text>+</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => setCounter(c => Math.max(0, c - 1))}
            style={s.smallButton}
          >
            <Text>-</Text>
          </AnimatedPressable>
        </View>
      </SpringFadeIn>

      {/* Section 8: Glassmorphism */}
      <SpringFadeIn delay={700}>
        <Text style={s.sectionTitle}>Glassmorphism</Text>
        <View style={[s.row, { backgroundColor: '#6C5CE7', padding: 20, borderRadius: 16 }]}>
          <GlassmorphismCard style={s.glassCard}>
            <Text style={s.glassText}>Glass Effect</Text>
          </GlassmorphismCard>
        </View>
      </SpringFadeIn>

      {/* Section 9: Breathing Glow */}
      <SpringFadeIn delay={800}>
        <Text style={s.sectionTitle}>Breathing Glow</Text>
        <View style={s.row}>
          <BreathingGlow color={theme.colors.primary}>
            <View style={s.glowContent}>
              <Text style={s.glowText}>Premium</Text>
            </View>
          </BreathingGlow>
        </View>
      </SpringFadeIn>

      {/* Section 10: Floating Button */}
      <SpringFadeIn delay={900}>
        <Text style={s.sectionTitle}>Floating Button</Text>
        <View style={s.row}>
          <AnimatedFloatingButton
            label="Создать план"
            onPress={() => {}}
            icon="✨"
          />
        </View>
      </SpringFadeIn>

      {/* Section 11: Skeletons */}
      <SpringFadeIn delay={1000}>
        <Text style={s.sectionTitle}>Skeleton Loaders</Text>
        <SkeletonCard />
        <View style={s.skeletonRow}>
          <Skeleton width={60} height={60} circle />
          <View style={s.skeletonText}>
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
          </View>
        </View>
      </SpringFadeIn>

      <View style={s.footer} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  demoButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  demoCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  cardText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  smallButton: {
    backgroundColor: theme.colors.surfaceAlt,
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  counter: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  glassCard: {
    padding: theme.spacing.xl,
    minWidth: 150,
    alignItems: 'center',
  },
  glassText: {
    color: '#fff',
    fontWeight: '600',
  },
  glowContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  glowText: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  skeletonText: {
    flex: 1,
  },
  footer: {
    height: 100,
  },
});

export default AnimationShowcase;
