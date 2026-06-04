import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export const SectionHeader = ({ title, subtitle, style }) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.title,
          {
            color: themeColors.text,
            fontSize: typography.sizes.xl,
            fontFamily: typography.fonts.bold,
          },
        ]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: themeColors.secondaryText,
              fontSize: typography.sizes.sm,
              fontFamily: typography.fonts.regular,
              marginTop: spacing.xs,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  title: {
    // Platform specific fonts can be added here
  },
  subtitle: {
    // Platform specific fonts can be added here
  },
});
