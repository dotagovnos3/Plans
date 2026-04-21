// ANIMATED CHIP - Interactive chip with spring selection animation
// Usage: Category filters, tags, status indicators

import React, { useEffect } from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: ViewStyle;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable
);

export const AnimatedChip: React.FC<AnimatedChipProps> = ({
  label,
  active,
  onPress,
  style,
  index = 0,
}) => {
  const activeProgress = useSharedValue(active ? 1 : 0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    activeProgress.value = withSpring(active ? 1 : 0, {
      damping: 15,
      stiffness: 400,
      mass: 0.8,
    });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.surface, theme.colors.primary]
    );

    const borderColor = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    );

    const scale = interpolate(
      pressProgress.value,
      [0, 1],
      [1, 0.92],
      Extrapolation.CLAMP
    );

    const shadowOpacity = interpolate(
      activeProgress.value,
      [0, 1],
      [0, 0.2],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor,
      borderColor,
      transform: [{ scale }],
      shadowOpacity,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.textSecondary, theme.colors.textInverse]
    );

    return {
      color,
    };
  });

  const handlePressIn = () => {
    pressProgress.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressProgress.value = withSpring(0, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[s.chip, style, animatedStyle]}
    >
      <Animated.Text style={[s.text, textStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
};

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  text: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
});
