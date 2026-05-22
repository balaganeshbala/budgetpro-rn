import { StyleSheet, useColorScheme, View } from 'react-native';
// Note: Ensure @expo/vector-icons is installed. We use Ionicons to mimic SF Symbols.
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';

export const IconShape = {
  CIRCLE: 'circle',
  ROUNDED_RECTANGLE: 'roundedRectangle',
};

export const RowItemIcon = ({
  categoryIcon,
  iconShape = IconShape.ROUNDED_RECTANGLE,
  iconColor,
  backgroundColor,
  size = 40,
}) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const defaultIconColor = iconColor || themeColors.secondaryText;
  const defaultBgColor = backgroundColor || (iconColor || themeColors.primary) + '1A'; // 10% opacity hex approximation

  const shapeStyle =
    iconShape === IconShape.CIRCLE
      ? { borderRadius: size / 2 }
      : { borderRadius: radius.sm };

  return (
    <View
      style={[
        styles.container,
        shapeStyle,
        {
          width: size,
          height: size,
          backgroundColor: defaultBgColor,
        },
      ]}
    >
      <Ionicons name={categoryIcon} size={size * 0.5} color={defaultIconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
