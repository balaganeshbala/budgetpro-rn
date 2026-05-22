import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../constants/theme';

export const AppTextField = ({
  hint,
  iconName,
  iconText,
  value,
  onChangeText,
  keyboardType = 'default',
  returnKeyType = 'done',
  autoCapitalize = 'none',
  onSubmitEditing,
  isSecure = false,
  trailingContent,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.inputBackground,
          borderColor: isFocused ? themeColors.focusedInputBorder : themeColors.inputBorder,
          borderWidth: isFocused ? 2 : 1,
        },
        style,
      ]}
    >
      {iconText ? (
        <Text style={[styles.iconText, { color: themeColors.secondaryText }]}>{iconText}</Text>
      ) : (
        iconName && (
          <Ionicons 
            name={iconName} 
            size={24} 
            color={themeColors.secondaryText} 
            style={styles.icon} 
          />
        )
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            color: themeColors.text,
            fontSize: typography.sizes.md,
            fontFamily: typography.fonts.medium,
          },
        ]}
        placeholder={hint}
        placeholderTextColor={themeColors.tertiaryText}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={isSecure}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {trailingContent && (
        <View style={styles.trailing}>
          {trailingContent()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  icon: {
    marginRight: spacing.sm,
  },
  iconText: {
    fontSize: 22,
    fontFamily: 'Manrope-Medium',
    marginRight: spacing.sm,
    width: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
  },
  trailing: {
    marginLeft: spacing.sm,
  },
});
