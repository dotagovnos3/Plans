// ANIMATED MODAL - Slide-in modal with backdrop blur
// Usage: Confirmation dialogs, bottom sheets, overlays

import React, { useEffect } from 'react';
import { View, Modal, ModalProps, StyleSheet, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedModalProps extends Omit<ModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
  style?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible,
  onClose,
  children,
  position = 'center',
  style,
  ...modalProps
}) => {
  const backdropProgress = useSharedValue(0);
  const contentProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropProgress.value = withTiming(1, { duration: 200 });
      contentProgress.value = withSpring(1, { damping: 14, stiffness: 200 });
    } else {
      backdropProgress.value = withTiming(0, { duration: 200 });
      contentProgress.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      backdropProgress.value,
      [0, 1],
      [0, 0.5],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      contentProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    let transform: any[] = [];

    if (position === 'center') {
      const scale = interpolate(
        contentProgress.value,
        [0, 1],
        [0.9, 1],
        Extrapolation.CLAMP
      );
      transform = [{ scale }];
    } else {
      const translateY = interpolate(
        contentProgress.value,
        [0, 1],
        [300, 0],
        Extrapolation.CLAMP
      );
      transform = [{ translateY }];
    }

    return {
      opacity,
      transform,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      {...modalProps}
    >
      <View style={s.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <AnimatedView style={[s.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>
        <AnimatedView
          style={[
            s.content,
            position === 'bottom' && s.contentBottom,
            style,
            contentStyle,
          ]}
        >
          {children}
        </AnimatedView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
    minWidth: 280,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  contentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
});
