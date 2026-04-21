// ANIMATED BADGE - Status badge with pulse animation
// Usage: Status indicators, notification badges, labels

import React, { useEffect } from 'react';
import { Text, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedBadgeProps {
  label: string;
  color?: string;
  pulse?: boolean;
  style?: ViewStyle;
  delay?: number;
}

const AnimatedView = Animated.createAnimatedComponent(
  require('react-native').View
);

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  label,
  color = theme.colors.primary,
  pulse = false,
  style,
  delay = 0,
}) => {
  const entryProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withSpring(1, { damping: 14, stiffness: 200 });

    if (pulse) {
      pulseProgress.value = withRepeat(
        withSequence(
          withSpring(1, { damping: 10, stiffness: 200 }),
          withSpring(0, { damping: 10, stiffness: 200 })
        ),
        -1,
        true
      );
    }
  }, [pulse]);

  const containerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      entryProgress.value,
      [0, 1],
      [0.8, 1],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      entryProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseProgress.value,
      [0, 1],
      [1, 1.3],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      pulseProgress.value,
      [0, 1],
      [0.5, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <AnimatedView style={[s.container, style, containerStyle]}>
      {pulse && (
        <AnimatedView
          style={[
            s.pulse,
            { backgroundColor: color },
            pulseStyle,
          ]}
        />
      )}
      <View style={[s.badge, { backgroundColor: color + '22' }]}>
        <Text style={[s.text, { color }]}>{label}</Text>
      </View>
    </AnimatedView>
  );
};

const s = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: theme.borderRadius.full,
    zIndex: -1,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...theme.typography.small,
    fontWeight: '700',
  },
});
