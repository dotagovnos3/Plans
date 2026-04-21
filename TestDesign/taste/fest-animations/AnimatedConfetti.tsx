// ANIMATED CONFETTI - Celebration effect for completed actions
// Usage: Plan completion, success states, achievements

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
}

interface AnimatedConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  particleCount?: number;
  colors?: string[];
  origin?: { x: number; y: number };
  style?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const COLORS = [
  theme.colors.primary,
  theme.colors.accent,
  theme.colors.success,
  theme.colors.accentLight,
  theme.colors.primaryLight,
];

export const AnimatedConfetti: React.FC<AnimatedConfettiProps> = ({
  trigger,
  onComplete,
  particleCount = 30,
  colors = COLORS,
  origin = { x: 0.5, y: 0.5 },
  style,
}) => {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const explosionProgress = useSharedValue(0);

  const generateParticles = useCallback(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 300,
        y: -200 - Math.random() * 200,
      },
    }));
  }, [particleCount, colors]);

  useEffect(() => {
    if (trigger) {
      const newParticles = generateParticles();
      setParticles(newParticles);
      explosionProgress.value = 0;
      explosionProgress.value = withDelay(
        50,
        withTiming(1, { duration: 1500 }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [trigger, generateParticles, onComplete]);

  return (
    <View style={[s.container, style]} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          particle={particle}
          progress={explosionProgress}
        />
      ))}
    </View>
  );
};

interface ParticleProps {
  particle: Particle;
  progress: Animated.SharedValue<number>;
}

const ConfettiParticle: React.FC<ParticleProps> = ({ particle, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;

    const translateX = particle.velocity.x * p;
    const translateY = particle.velocity.y * p + 200 * p * p; // Add gravity

    const rotate = particle.rotation + 720 * p;

    const opacity = interpolate(
      p,
      [0, 0.8, 1],
      [1, 1, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      p,
      [0, 0.2, 1],
      [0, 1, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
      opacity,
      backgroundColor: particle.color,
      width: particle.size,
      height: particle.size * 0.6,
    };
  });

  return (
    <AnimatedView style={[s.particle, animatedStyle]} />
  );
};

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});
