// ANIMATED CARD - Premium card with staggered entry, hover lift, and spotlight effect
// Usage: Event cards, plan cards, content cards

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  index?: number;
  onPress?: () => void;
  staggerDelay?: number;
  enableHover?: boolean;
  enableSpotlight?: boolean;
  spotlightColor?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  index = 0,
  onPress,
  staggerDelay = 80,
  enableHover = true,
  enableSpotlight = false,
  spotlightColor = theme.colors.primary,
}) => {
  const entryProgress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);
  const spotlightX = useSharedValue(0);
  const spotlightY = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * staggerDelay,
      withSpring(1, { damping: 14, stiffness: 200, mass: 0.6 })
    );
  }, [index, staggerDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      entryProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      entryProgress.value,
      [0, 1],
      [40, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      entryProgress.value,
      [0, 1],
      [0.95, 1],
      Extrapolation.CLAMP
    );

    const hoverTranslateY = enableHover
      ? interpolate(hoverProgress.value, [0, 1], [0, -4], Extrapolation.CLAMP)
      : 0;

    const hoverScale = enableHover
      ? interpolate(hoverProgress.value, [0, 1], [1, 1.01], Extrapolation.CLAMP)
      : 1;

    const shadowOpacity = enableHover
      ? interpolate(hoverProgress.value, [0, 1], [0.06, 0.15], Extrapolation.CLAMP)
      : 0.06;

    return {
      opacity,
      transform: [
        { translateY: translateY + hoverTranslateY },
        { scale: scale * hoverScale },
      ],
      shadowOpacity,
    };
  });

  const spotlightStyle = useAnimatedStyle(() => {
    if (!enableSpotlight) return {};

    const opacity = interpolate(
      hoverProgress.value,
      [0, 1],
      [0, 0.15],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      // Spotlight gradient would be implemented here
    };
  });

  const handleHoverIn = () => {
    if (enableHover) {
      hoverProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
    }
  };

  const handleHoverOut = () => {
    if (enableHover) {
      hoverProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
    }
  };

  return (
    <Animated.View
      style={[s.card, style, animatedStyle]}
      onPointerEnter={Platform.OS === 'web' ? handleHoverIn : undefined}
      onPointerLeave={Platform.OS === 'web' ? handleHoverOut : undefined}
      onTouchStart={handleHoverIn}
      onTouchEnd={handleHoverOut}
    >
      {enableSpotlight && (
        <Animated.View style={[s.spotlight, { backgroundColor: spotlightColor }, spotlightStyle]} />
      )}
      {children}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  spotlight: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    pointerEvents: 'none',
  },
});
