import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';

/**
 * Shared primary button component.
 * Props:
 *   title      – button label
 *   onPress    – handler
 *   isEnabled  – controls enabled/disabled visual state (default true)
 *   isLoading  – shows ActivityIndicator when true
 *   style      – optional extra container style
 */
export const AppButton = ({
  title,
  onPress,
  isEnabled = true,
  isLoading = false,
  variant = 'primary', // 'primary' | 'destructive'
  style,
}) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const activeColor = variant === 'destructive' ? themeColors.adaptiveRed : themeColors.primary;
  const backgroundColor = isEnabled ? activeColor : themeColors.separator;
  const textColor = isEnabled ? themeColors.white : themeColors.secondaryText;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      onPress={onPress}
      disabled={!isEnabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 55,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
  },
});
