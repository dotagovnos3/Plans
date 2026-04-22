import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { Aurora, FadeIn, Pressable, SplitText, springs } from '../motion';

type Slide = {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: '🎉',
    eyebrow: 'FEST · Знакомьтесь',
    title: 'Собирайтесь с друзьями',
    body: 'Один план — одна компания. Зовите своих и договаривайтесь без сотни чатов.',
  },
  {
    icon: '🗳',
    eyebrow: 'FEST · Решайте вместе',
    title: 'Предложения и голосования',
    body: 'Кидайте варианты места и времени — друзья голосуют, финалите лучший.',
  },
  {
    icon: '🔗',
    eyebrow: 'FEST · Одна ссылка',
    title: 'Делитесь ссылкой',
    body: 'Отправьте план одной ссылкой — друг откроет и присоединится за пару тапов.',
  },
];

const WEB_MAX_WIDTH = 600;

type Props = {
  onFinish: () => void;
};

export const OnboardingScreen = ({ onFinish }: Props) => {
  const window = useWindowDimensions();
  const pageWidth = Math.min(window.width, WEB_MAX_WIDTH);
  const scrollRef = React.useRef<ScrollView>(null);
  const [index, setIndex] = React.useState(0);
  const isLast = index === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== index) setIndex(next);
  };

  const goTo = (target: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, target));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
  };

  const handlePrimary = () => {
    if (isLast) onFinish();
    else goTo(index + 1);
  };

  return (
    <View style={s.root}>
      <Aurora intensity="strong" />
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.topRow}>
            <Text style={s.brandMark}>FEST</Text>
            {!isLast ? (
              <Pressable onPress={onFinish} activeScale={0.94} hitSlop={12}>
                <Text style={s.skip}>Пропустить</Text>
              </Pressable>
            ) : (
              <View style={s.skipPlaceholder} />
            )}
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            onScrollEndDrag={handleScroll}
            scrollEventThrottle={16}
            style={s.pager}
          >
            {SLIDES.map((slide, i) => (
              <View key={i} style={[s.page, { width: pageWidth }]}>
                <Slide slide={slide} active={i === index} />
              </View>
            ))}
          </ScrollView>

          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <Dot key={i} active={i === index} />
            ))}
          </View>

          <View style={s.ctaWrap}>
            <Pressable style={s.primary} onPress={handlePrimary} activeScale={0.97}>
              <Text style={s.primaryText}>{isLast ? 'Начать' : 'Далее'}</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
};

const Slide = ({ slide, active }: { slide: Slide; active: boolean }) => (
  <View style={s.slide}>
    <FadeIn delay={60} direction="down" distance={8}>
      <Text style={s.eyebrow}>{slide.eyebrow}</Text>
    </FadeIn>
    <View style={s.iconWrap}>
      <FadeIn delay={120} direction="up" distance={12}>
        <View style={s.iconCircle}>
          <Text style={s.icon}>{slide.icon}</Text>
        </View>
      </FadeIn>
    </View>
    {active ? (
      <SplitText
        text={slide.title}
        style={s.title}
        delay={220}
        step={28}
        distance={20}
      />
    ) : (
      <Text style={s.title}>{slide.title}</Text>
    )}
    <FadeIn delay={520} direction="up" distance={10}>
      <Text style={s.body}>{slide.body}</Text>
    </FadeIn>
  </View>
);

const Dot = ({ active }: { active: boolean }) => {
  const progress = useSharedValue(active ? 1 : 0);
  React.useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, springs.smooth);
  }, [active]);
  const style = useAnimatedStyle(() => {
    const width = interpolate(progress.value, [0, 1], [8, 22], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0.35, 1], Extrapolation.CLAMP);
    return {
      width,
      opacity,
      backgroundColor: active ? theme.colors.primary : theme.colors.textTertiary,
    };
  });
  return <Animated.View style={[s.dot, style]} />;
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.select({ web: theme.spacing.lg, default: theme.spacing.xl }),
  },
  brandMark: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 5,
    color: theme.colors.primaryDark,
  },
  skip: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  skipPlaceholder: { width: 80 },
  pager: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 480,
  },
  eyebrow: {
    fontFamily: theme.fonts.displayMedium,
    fontSize: 11,
    letterSpacing: 4,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 18px 40px -20px rgba(108,92,231,0.45)' } as any,
      default: theme.shadows.lg,
    }),
  },
  icon: { fontSize: 56 },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: Platform.OS === 'web' ? 32 : 28,
    lineHeight: Platform.OS === 'web' ? 38 : 34,
    color: theme.colors.primaryDark,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaWrap: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: Platform.select({ web: theme.spacing.xxl, default: theme.spacing.xxxl }),
  },
  primary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: Platform.select({ web: theme.spacing.md, default: theme.spacing.lg }),
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  primaryText: {
    ...theme.typography.bodyBold,
    fontSize: 16,
    color: theme.colors.textInverse,
    letterSpacing: 0.3,
  },
});
