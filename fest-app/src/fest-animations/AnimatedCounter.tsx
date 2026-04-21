// ANIMATED COUNTER - Number counter with spring animation
// Usage: Vote counts, participant counts, statistics

import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  duration?: number;
  format?: (val: number) => string;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  style,
  format = (val) => Math.round(val).toString(),
}) => {
  const animatedValue = useSharedValue(value);
  const prevValue = useSharedValue(value);

  useEffect(() => {
    prevValue.value = animatedValue.value;
    animatedValue.value = withSpring(value, {
      damping: 15,
      stiffness: 100,
      mass: 0.5,
    });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animatedValue.value,
      [prevValue.value - 0.1, prevValue.value, prevValue.value + 0.1],
      [1.1, 1, 1.1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  const displayValue = useSharedValue(value);
  
  useEffect(() => {
    displayValue.value = withTiming(value, { duration: 500 });
  }, [value]);

  // Simplified version - just show the value
  return (
    <AnimatedText style={[s.text, style, animatedStyle]}>
      {format(value)}
    </AnimatedText>
  );
};

const s = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});
