// ANIMATED PRESSABLE - Spring physics button with scale feedback
// Usage: Wrap any interactive element for premium tactile feedback

import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  activeScale?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  hitSlop?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  style,
  disabled = false,
  activeScale = 0.96,
  springConfig = { damping: 15, stiffness: 400, mass: 0.8 },
  hitSlop,
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, activeScale],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, springConfig);
    onPressIn?.();
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, springConfig);
    onPressOut?.();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      <Animated.View style={[s.base, style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const s = StyleSheet.create({
  base: {
    // Base styles for pressable
  },
});
