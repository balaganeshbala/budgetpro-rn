import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { RowItemIcon } from './RowItemIcon';

export function SettingsRow({ iconName, iconColor, iconBg, title, showChevron = true, onPress }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];
  const bg = iconBg ?? (iconColor + '22');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <RowItemIcon
        categoryIcon={iconName} 
        iconShape="roundedRectangle" 
        iconColor={iconColor}
        backgroundColor={bg}
        containerSize={32}
        iconSize={20}
      />
      <Text style={[styles.rowTitle, { color: themeColors.text }]}>{title}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color={themeColors.secondaryText} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
});
