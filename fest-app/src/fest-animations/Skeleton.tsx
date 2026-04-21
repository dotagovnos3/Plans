// ANIMATED SKELETON - Shimmer skeleton loader
// Usage: Loading states, data fetching

import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  style?: ViewStyle;
  circle?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  style,
  circle = false,
}) => {
  const shimmerProgress = useSharedValue(0);

  shimmerProgress.value = withRepeat(
    withTiming(1, { duration: 1500 }),
    -1,
    true
  );

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = -screenWidth + (shimmerProgress.value * screenWidth * 2);

    return {
      transform: [{ translateX }],
    };
  });

  const resolvedWidth = typeof width === 'number' ? width : screenWidth;
  const resolvedHeight = circle ? (typeof width === 'number' ? width : 40) : height;
  const borderRadius = circle ? resolvedHeight / 2 : theme.borderRadius.md;

  return (
    <View
      style={[
        s.container,
        {
          width,
          height: resolvedHeight,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[s.shimmer, shimmerStyle]} />
    </View>
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[s.card, style]}>
      <Skeleton width="100%" height={140} style={s.cardImage} />
      <View style={s.cardContent}>
        <Skeleton width="30%" height={12} style={s.cardMeta} />
        <Skeleton width="80%" height={20} style={s.cardTitle} />
        <Skeleton width="60%" height={14} style={s.cardSubtitle} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceAlt,
    overflow: 'hidden',
  },
  shimmer: {
    width: screenWidth,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  cardImage: {
    borderRadius: 0,
  },
  cardContent: {
    padding: theme.spacing.lg,
  },
  cardMeta: {
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    marginTop: theme.spacing.xs,
  },
});
