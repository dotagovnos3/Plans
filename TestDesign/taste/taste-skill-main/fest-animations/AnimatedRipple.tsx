// ANIMATED RIPPLE - Touch ripple effect
// Usage: Buttons, cards, any interactive element

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface AnimatedRippleProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  rippleColor?: string;
  rippleDuration?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const AnimatedRipple: React.FC<AnimatedRippleProps> = ({
  children,
  onPress,
  style,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  rippleDuration = 400,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const rippleIdCounter = React.useRef(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const id = rippleIdCounter.current++;

    const newRipple: Ripple = {
      id,
      x: locationX,
      y: locationY,
    };

    setRipples((prev) => [...prev, newRipple]);

    onPress?.();
  };

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const maxRadius = Math.max(dimensions.width, dimensions.height) * 1.5;

  return (
    <View
      style={[s.container, style]}
      onLayout={handleLayout}
      onTouchEnd={handlePress}
    >
      {children}
      {ripples.map((ripple) => (
        <RippleCircle
          key={ripple.id}
          ripple={ripple}
          maxRadius={maxRadius}
          color={rippleColor}
          duration={rippleDuration}
          onComplete={() => removeRipple(ripple.id)}
        />
      ))}
    </View>
  );
};

interface RippleCircleProps {
  ripple: Ripple;
  maxRadius: number;
  color: string;
  duration: number;
  onComplete: () => void;
}

const RippleCircle: React.FC<RippleCircleProps> = ({
  ripple,
  maxRadius,
  color,
  duration,
  onComplete,
}) => {
  const progress = useSharedValue(0);

  progress.value = withSequence(
    withTiming(1, { duration }),
    withTiming(0, { duration: 0 }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    })
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: ripple.x },
        { translateY: ripple.y },
        { scale: progress.value * maxRadius },
      ],
      opacity: 1 - progress.value,
      backgroundColor: color,
    };
  });

  return (
    <AnimatedView
      style={[
        s.ripple,
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

const s = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 999,
    top: 0,
    left: 0,
  },
});
