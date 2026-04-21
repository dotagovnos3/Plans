// ANIMATED COUNTER - Number counter with spring animation
// Usage: Vote counts, participant counts, statistics

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
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
  duration = 800,
  format = (val) => Math.round(val).toString(),
}) => {
  const displayValue = useSharedValue(value);
  const previousValue = useRef(value);
  const [text, setText] = React.useState(format(value));

  useEffect(() => {
    if (value !== previousValue.current) {
      displayValue.value = withSpring(value, {
        damping: 15,
        stiffness: 100,
        mass: 0.5,
      }, (finished) => {
        if (finished) {
          runOnJS(setText)(format(value));
        }
      });
      previousValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const id = displayValue.addListener((v) => {
      runOnJS(setText)(format(v.value));
    });

    return () => {
      displayValue.removeListener(id);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const diff = Math.abs(value - previousValue.current);
    const intensity = Math.min(diff / 10, 1);

    const scale = interpolate(
      displayValue.value,
      [previousValue.current - 0.1, previousValue.current, previousValue.current + 0.1],
      [1.1, 1, 1.1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <AnimatedText style={[s.text, style, animatedStyle]}>
      {text}
    </AnimatedText>
  );
};

const s = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});
