// BREATHING GLOW - Pulsing glow effect for premium feel
// Usage: Premium elements, highlights, featured items

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface BreathingGlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  speed?: number; // Duration in ms
  style?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const BreathingGlow: React.FC<BreathingGlowProps> = ({
  children,
  color = theme.colors.primary,
  intensity = 0.5,
  speed = 3000,
  style,
}) => {
  const breatheProgress = useSharedValue(0);

  breatheProgress.value = withRepeat(
    withTiming(1, { duration: speed }),
    -1,
    true
  );

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      breatheProgress.value,
      [0, 1],
      [intensity * 0.5, intensity],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      breatheProgress.value,
      [0, 1],
      [1, 1.05],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={[s.container, style]}>
      <AnimatedView
        style={[
          s.glow,
          { backgroundColor: color },
          glowStyle,
        ]}
      />
      <View style={s.content}>{children}</View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: theme.borderRadius.lg,
    opacity: 0.5,
    shadowColor: 'inherit',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
