// PARALLAX SCROLL - Scroll view with parallax header effect
// Usage: Event details, profile screens with hero images

import React from 'react';
import { View, ScrollView, ScrollViewProps, ViewStyle, Platform, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface ParallaxScrollProps extends Omit<ScrollViewProps, 'onScroll'> {
  headerHeight?: number;
  headerComponent?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  parallaxRate?: number; // 0.5 = half speed, 1 = full speed
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
  headerHeight = 200,
  headerComponent,
  children,
  style,
  parallaxRate = 0.5,
  ...scrollProps
}) => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = scrollY.value * parallaxRate;
    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [1.2, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight * 0.8],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY: Math.max(0, translateY) },
        { scale },
      ],
      opacity,
      height: headerHeight,
    };
  });

  return (
    <View style={[s.container, style]}>
      <Animated.View style={[s.header, headerStyle]}>
        {headerComponent}
      </Animated.View>
      <AnimatedScrollView
        {...scrollProps}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: headerHeight },
        ]}
      >
        {children}
      </AnimatedScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    minHeight: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
});
