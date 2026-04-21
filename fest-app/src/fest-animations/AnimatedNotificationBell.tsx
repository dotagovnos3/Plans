// ANIMATED NOTIFICATION BELL - Bell with bouncing badge animation
// Usage: Notification icons with unread count

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

interface AnimatedNotificationBellProps {
  count: number;
  onPress: () => void;
  delay?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const AnimatedNotificationBell: React.FC<AnimatedNotificationBellProps> = ({
  count,
  onPress,
  delay = 200,
}) => {
  const entryProgress = useSharedValue(0);
  const badgeBounce = useSharedValue(0);
  const prevCountRef = React.useRef(count);

  useEffect(() => {
    entryProgress.value = withDelay(
      delay,
      withSpring(1, { damping: 14, stiffness: 200 })
    );
  }, [delay]);

  useEffect(() => {
    if (count > prevCountRef.current && count > 0) {
      // Trigger bounce animation when count increases
      badgeBounce.value = withSequence(
        withSpring(-10, { damping: 8, stiffness: 400 }),
        withSpring(0, { damping: 8, stiffness: 400 })
      );
    }
    prevCountRef.current = count;
  }, [count]);

  const bellStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      entryProgress.value,
      [0, 1],
      [-15, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }],
      opacity: entryProgress.value,
    };
  });

  const badgeStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      entryProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    const bounceY = badgeBounce.value;

    return {
      transform: [{ scale }, { translateY: bounceY }],
      opacity: count > 0 ? 1 : 0,
    };
  });

  const countStyle = useAnimatedStyle(() => {
    const scale = count > 9
      ? interpolate(badgeBounce.value, [-10, 0], [1.1, 1], Extrapolation.CLAMP)
      : 1;

    return {
      transform: [{ scale }],
    };
  });

  return (
    <AnimatedPressable onPress={onPress} style={s.container}>
      <AnimatedView style={[s.bell, bellStyle]}>
        <Text style={s.bellIcon}>🔔</Text>
      </AnimatedView>
      {count > 0 && (
        <AnimatedView style={[s.badge, badgeStyle]}>
          <Animated.Text style={[s.badgeText, countStyle]}>
            {count > 99 ? '99+' : count}
          </Animated.Text>
        </AnimatedView>
      )}
    </AnimatedPressable>
  );
};

const s = StyleSheet.create({
  container: {
    position: 'relative',
    padding: theme.spacing.sm,
  },
  bell: {
    // View style
  } as ViewStyle,
  bellIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
