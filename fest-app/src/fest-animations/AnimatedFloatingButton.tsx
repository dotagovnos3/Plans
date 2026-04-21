// ANIMATED FLOATING BUTTON - FAB with spring scale and glow effects
// Usage: Primary action buttons, create buttons

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

interface AnimatedFloatingButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'accent' | 'success';
  icon?: string;
}

export const AnimatedFloatingButton: React.FC<AnimatedFloatingButtonProps> = ({
  label,
  onPress,
  style,
  variant = 'primary',
  icon,
}) => {
  const glowProgress = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      glowProgress.value,
      [0, 1],
      [0.3, 0.6],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      glowProgress.value,
      [0, 1],
      [1, 1.2],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const handleHoverIn = () => {
    glowProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleHoverOut = () => {
    glowProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  const backgroundColor = {
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    success: theme.colors.success,
  }[variant];

  return (
    <View style={style}>
      {/* Glow effect */}
      <Animated.View
        style={[s.glow, { backgroundColor }, glowStyle]}
      />
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handleHoverIn}
        onPressOut={handleHoverOut}
        style={[s.button, { backgroundColor }]}
        activeScale={0.95}
      >
        <Text style={s.text}>
          {icon ? <Text style={s.icon}>{icon} </Text> : null}
          {label}
        </Text>
      </AnimatedPressable>
    </View>
  );
};

const s = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: theme.borderRadius.full,
    opacity: 0,
    shadowColor: 'inherit',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  button: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  icon: {
    fontSize: 16,
  },
});
