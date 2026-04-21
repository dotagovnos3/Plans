// ANIMATED TABS - Smooth sliding tab indicator with spring physics
// Usage: Tab navigation with premium feel

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface TabItem {
  key: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: any;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  style,
}) => {
  const tabLayouts = useRef<Map<string, { x: number; width: number }>>(new Map());
  const indicatorProgress = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  useEffect(() => {
    const activeTab = tabLayouts.current.get(activeKey);
    if (activeTab) {
      indicatorProgress.value = withSpring(activeTab.x, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      indicatorWidth.value = withSpring(activeTab.width, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
    }
  }, [activeKey]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorProgress.value }],
      width: indicatorWidth.value,
    };
  });

  const handleLayout = (key: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current.set(key, { x, width });

    // Update indicator immediately if this is the active tab
    if (key === activeKey) {
      indicatorProgress.value = x;
      indicatorWidth.value = width;
    }
  };

  return (
    <View style={[s.container, style]}>
      <View style={s.tabRow}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeKey === tab.key}
            onPress={() => onChange(tab.key)}
            onLayout={handleLayout(tab.key)}
          />
        ))}
        <AnimatedView style={[s.indicator, indicatorStyle]} />
      </View>
    </View>
  );
};

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  tab,
  isActive,
  onPress,
  onLayout,
}) => {
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withSpring(isActive ? 1 : 0, {
      damping: 20,
      stiffness: 300,
    });
  }, [isActive]);

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      activeProgress.value,
      [0, 1],
      [theme.colors.textSecondary, theme.colors.primary]
    );

    return {
      color,
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onLayout={onLayout}
      style={s.tab}
      activeOpacity={0.7}
    >
      <Animated.Text style={[s.tabText, textStyle]}>
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  tabText: {
    ...theme.typography.bodyBold,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
});
