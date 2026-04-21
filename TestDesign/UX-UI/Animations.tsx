import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Platform } from 'react-native';
import { theme } from '../theme';

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}

export const FadeIn = ({ children, delay = 0, style }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

export const SlideInRight = ({ children, delay = 0, style }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
};

export const ScaleIn = ({ children, delay = 0, style }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        damping: theme.anim.spring.damping,
        stiffness: theme.anim.spring.stiffness,
        mass: theme.anim.spring.mass,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};

interface PressableScaleProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
  activeScale?: number;
  hitSlop?: any;
}

export const PressableScale = ({
  children,
  onPress,
  style,
  disabled = false,
  activeScale = theme.anim.scale.pressIn,
  hitSlop,
}: PressableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
      damping: theme.anim.springBouncy.damping,
      stiffness: theme.anim.springBouncy.stiffness,
      mass: theme.anim.springBouncy.mass,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: theme.anim.springBouncy.damping,
      stiffness: theme.anim.springBouncy.stiffness,
      mass: theme.anim.springBouncy.mass,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Animated.View
        onTouchStart={pressIn}
        onTouchEnd={pressOut}
        onTouchCancel={pressOut}
        onResponderRelease={pressOut}
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <Animated.View onStartShouldSetResponder={() => true} onResponderRelease={() => { pressOut(); if (!disabled) onPress(); }}>
          {children}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
}

export const StaggeredList = ({ children, staggerDelay = theme.anim.timing.stagger }: StaggeredListProps) => {
  return (
    <>
      {children.map((child, i) => (
        <FadeIn key={i} delay={i * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </>
  );
};

interface AnimatedChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: any;
}

export const AnimatedChip = ({ label, active, onPress, style }: AnimatedChipProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(bgAnim, {
      toValue: active ? 1 : 0,
      damping: theme.anim.spring.damping,
      stiffness: theme.anim.spring.stiffness,
      mass: theme.anim.spring.mass,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: theme.anim.scale.pressIn,
      ...theme.anim.springBouncy,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      ...theme.anim.springBouncy,
      useNativeDriver: true,
    }).start();
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface, theme.colors.primary],
  });

  const textColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.textSecondary, theme.colors.textInverse],
  });

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Animated.View
        onTouchStart={pressIn}
        onTouchEnd={pressOut}
        onTouchCancel={pressOut}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => { pressOut(); onPress(); }}
        style={[
          s.chipBase,
          {
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
      >
        <Animated.Text style={[theme.typography.caption, { color: textColor, fontWeight: active ? '600' : '400' }]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  delay?: number;
  animated?: boolean;
}

export const GlassCard = ({ children, style, delay = 0, animated = true }: GlassCardProps) => {
  const opacity = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animated ? 8 : 0)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.anim.timing.entrance,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.glassCard,
        animated && { opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface PulseProps {
  children: React.ReactNode;
  active: boolean;
  style?: any;
}

export const Pulse = ({ children, active, style }: PulseProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => { loop.stop(); };
  }, [active]);

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  chipBase: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassCard: {
    ...theme.glass.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
});
