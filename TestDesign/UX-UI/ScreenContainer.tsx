import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenContainer = ({ children, style }: Props) => (
  <View style={[s.root, style]}>{children}</View>
);

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { maxWidth: 600, width: '100%', alignSelf: 'center' },
    }),
  },
});
