// ANIMATED IMAGE - Image with shimmer loading and scale reveal
// Usage: Event covers, avatars, any images

import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ViewStyle, ImageProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedImageProps {
  source: ImageProps['source'];
  style?: ViewStyle;
  resizeMode?: ImageProps['resizeMode'];
  delay?: number;
  shimmer?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export const AnimatedImageComponent: React.FC<AnimatedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  delay = 0,
  shimmer = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const loadProgress = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    if (shimmer && !isLoaded) {
      shimmerProgress.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      cancelAnimation(shimmerProgress);
    }
  }, [shimmer, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      loadProgress.value = withDelay(
        delay,
        withSpring(1, { damping: 14, stiffness: 200, mass: 0.6 })
      );
    }
  }, [isLoaded, delay]);

  const imageStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      loadProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      loadProgress.value,
      [0, 1],
      [1.05, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-200, 200],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[s.container, style]}>
      {!isLoaded && shimmer && (
        <AnimatedView style={[s.shimmer, shimmerStyle]}>
          <View style={s.shimmerGradient} />
        </AnimatedView>
      )}
      <AnimatedImage
        source={source}
        style={[s.image, imageStyle, style]}
        resizeMode={resizeMode}
        onLoad={() => setIsLoaded(true)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
});
