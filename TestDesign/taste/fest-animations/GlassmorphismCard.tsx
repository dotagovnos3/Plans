// GLASSMORPHISM CARD - Premium glass effect with backdrop blur
// Usage: Modals, floating cards, premium UI elements

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number; // 0-1, default 0.15
  borderOpacity?: number; // 0-1, default 0.3
  blur?: number; // Web only, default 20
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  style,
  intensity = 0.15,
  borderOpacity = 0.3,
  blur = 20,
}) => {
  const hoverProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      hoverProgress.value,
      [0, 1],
      [1, 1.02],
      Extrapolation.CLAMP
    );

    const borderOpacityValue = interpolate(
      hoverProgress.value,
      [0, 1],
      [borderOpacity, borderOpacity * 1.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      borderColor: `rgba(255, 255, 255, ${borderOpacityValue})`,
    };
  });

  const handleHoverIn = () => {
    hoverProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleHoverOut = () => {
    hoverProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  const webStyles = Platform.select({
    web: {
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
    } as any,
    default: {},
  });

  return (
    <AnimatedView
      style={[
        s.card,
        {
          backgroundColor: `rgba(255, 255, 255, ${intensity})`,
          borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
        },
        webStyles,
        style,
        animatedStyle,
      ]}
      onPointerEnter={Platform.OS === 'web' ? handleHoverIn : undefined}
      onPointerLeave={Platform.OS === 'web' ? handleHoverOut : undefined}
    >
      {children}
    </AnimatedView>
  );
};

const s = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    ...Platform.select({
      ios: {
        // iOS doesn't support backdrop-filter in RN
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
      },
      android: {
        // Android needs SurfaceView for blur
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
});
