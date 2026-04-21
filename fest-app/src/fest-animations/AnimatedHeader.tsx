// ANIMATED HEADER - Premium header with parallax and spring animation
// Usage: Screen headers with animated title

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  variant?: 'large' | 'medium' | 'small';
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  style,
  delay = 0,
  variant = 'medium',
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, { damping: 13, stiffness: 180, mass: 0.7 })
    );
  }, [delay]);

  const containerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [-30, 0],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const letterSpacing = interpolate(
      progress.value,
      [0, 1],
      [2, -0.5],
      Extrapolation.CLAMP
    );

    return {
      letterSpacing,
    };
  });

  const typographyVariant = {
    large: theme.typography.h1,
    medium: theme.typography.h2,
    small: theme.typography.h3,
  };

  return (
    <AnimatedView style={[s.container, style, containerStyle]}>
      <View style={s.textContainer}>
        <AnimatedText style={[typographyVariant[variant], s.title, titleStyle]}>
          {title}
        </AnimatedText>
        {subtitle && (
          <Text style={[theme.typography.body, s.subtitle]}>{subtitle}</Text>
        )}
      </View>
      {rightElement && <View style={s.right}>{rightElement}</View>}
    </AnimatedView>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  right: {
    marginLeft: theme.spacing.md,
  },
});
