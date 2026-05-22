import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { RowItemIcon } from './common/RowItemIcon';

export const TransactionRow = ({
  title,
  amount,
  dateString,
  categoryIcon,
  iconShape,
  iconColor,
  backgroundColor,
  amountColor,
  showChevron = true,
  onPress,
}) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  // Helper to format currency (assuming ₹)
  const formatAmount = (val) => {
    return Math.round(val).toLocaleString('en-IN');
  };

  const defaultAmountColor = amountColor || themeColors.text;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.contentRow}>
        <RowItemIcon 
          categoryIcon={categoryIcon} 
          iconShape={iconShape} 
          iconColor={iconColor}
          backgroundColor={backgroundColor}
        />

        <View style={styles.textContainer}>
          <Text 
            style={[styles.title, { color: themeColors.text }]} 
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text 
            style={[styles.date, { color: themeColors.secondaryText }]}
          >
            {dateString}
          </Text>
        </View>

        <Text style={[styles.amount, { color: defaultAmountColor }]}>
          ₹{formatAmount(amount)}
        </Text>

        {showChevron && (
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={themeColors.secondaryText} 
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    marginBottom: spacing.xs / 2,
  },
  date: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  amount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
