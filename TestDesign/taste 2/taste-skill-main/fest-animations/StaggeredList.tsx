// STAGGERED LIST - List with cascading staggered entry animation
// Usage: Event lists, plan lists, any FlatList content

import React, { useEffect } from 'react';
import { FlatList, FlatListProps, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface StaggeredListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  staggerDelay?: number;
  baseDelay?: number;
  animationType?: 'slideUp' | 'slideLeft' | 'fade' | 'scale';
}

const AnimatedView = Animated.createAnimatedComponent(View);

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay: number;
  baseDelay: number;
  animationType: 'slideUp' | 'slideLeft' | 'fade' | 'scale';
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  staggerDelay,
  baseDelay,
  animationType,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      baseDelay + index * staggerDelay,
      withSpring(1, { damping: 14, stiffness: 200, mass: 0.6 })
    );
  }, [index, staggerDelay, baseDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    let transform: any[] = [];

    if (animationType === 'slideUp') {
      const translateY = interpolate(
        progress.value,
        [0, 1],
        [50, 0],
        Extrapolation.CLAMP
      );
      transform = [{ translateY }];
    } else if (animationType === 'slideLeft') {
      const translateX = interpolate(
        progress.value,
        [0, 1],
        [30, 0],
        Extrapolation.CLAMP
      );
      transform = [{ translateX }];
    } else if (animationType === 'scale') {
      const scale = interpolate(
        progress.value,
        [0, 1],
        [0.9, 1],
        Extrapolation.CLAMP
      );
      transform = [{ scale }];
    }

    return {
      opacity,
      transform,
    };
  });

  return (
    <AnimatedView style={[s.itemContainer, animatedStyle]}>
      {children}
    </AnimatedView>
  );
};

export function StaggeredList<T>({
  data,
  renderItem,
  staggerDelay = 60,
  baseDelay = 100,
  animationType = 'slideUp',
  ...flatListProps
}: StaggeredListProps<T>) {
  const wrappedRenderItem = ({ item, index }: { item: T; index: number }) => (
    <AnimatedListItem
      index={index}
      staggerDelay={staggerDelay}
      baseDelay={baseDelay}
      animationType={animationType}
    >
      {renderItem({ item, index })}
    </AnimatedListItem>
  );

  return (
    <FlatList
      data={data}
      renderItem={wrappedRenderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.listContent}
      {...flatListProps}
    />
  );
}

const s = StyleSheet.create({
  itemContainer: {
    marginBottom: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
});
