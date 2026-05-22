import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { colors, radius as defaultRadius, shadows } from '../../constants/theme';

export const CardView = ({
  children,
  padding = 16,
  cornerRadius = defaultRadius.lg,
  style,
}) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const themeShadows = shadows[scheme];

  return (
    <View
      style={[
        styles.card,
        {
          padding,
          borderRadius: cornerRadius,
          backgroundColor: themeColors.cardBackground,
          ...themeShadows,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
