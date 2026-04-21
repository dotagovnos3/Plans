// SPRING FADE IN - Fade-in wrapper with spring physics
// Usage: Page transitions, section reveals

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface SpringFadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  style?: ViewStyle;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
}

export const SpringFadeIn: React.FC<SpringFadeInProps> = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 30,
  style,
  springConfig = { damping: 14, stiffness: 200, mass: 0.6 },
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, springConfig)
    );
  }, [delay, springConfig]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    let translateX = 0;
    let translateY = 0;

    if (direction === 'up') {
      translateY = interpolate(
        progress.value,
        [0, 1],
        [distance, 0],
        Extrapolation.CLAMP
      );
    } else if (direction === 'down') {
      translateY = interpolate(
        progress.value,
        [0, 1],
        [-distance, 0],
        Extrapolation.CLAMP
      );
    } else if (direction === 'left') {
      translateX = interpolate(
        progress.value,
        [0, 1],
        [distance, 0],
        Extrapolation.CLAMP
      );
    } else if (direction === 'right') {
      translateX = interpolate(
        progress.value,
        [0, 1],
        [-distance, 0],
        Extrapolation.CLAMP
      );
    }

    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.95, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
