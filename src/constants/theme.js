export const colors = {
  light: {
    primary: '#216DF3',
    secondary: '#E640A6',
    adaptiveGreen: '#428F7D',
    adaptiveRed: '#FF6B6B',
    
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    groupedBackground: '#F2F2F2',
    toolbarBackground: '#F8F8F8',
    
    white: '#FFFFFF',
    black: '#000000',
    
    text: '#000000',
    secondaryText: '#3C3C4399',
    tertiaryText: '#3C3C434D',
    quaternaryText: '#3C3C432E',
    
    separator: '#C6C6C8',
    opaqueSeparator: '#C6C6C8',
    
    inputBackground: '#FFFFFF',
    inputBorder: '#D1D1D6',
    focusedInputBorder: '#216DF3',
    
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#007AFF',
    
    budgetProgress: '#216DF3',
    overBudget: '#FF3B30',
  },
  dark: {
    primary: '#2E7AFF',
    secondary: '#D94CA6',
    adaptiveGreen: '#4DB399',
    adaptiveRed: '#FF6666',
    
    background: '#000000',
    cardBackground: '#1C1C1E', // iOS secondarySystemGroupedBackground
    groupedBackground: '#2C2C2E', // iOS tertiarySystemGroupedBackground
    
    white: '#FFFFFF',
    black: '#000000',
    
    text: '#FFFFFF',
    secondaryText: '#EBEBF599',
    tertiaryText: '#EBEBF54D',
    quaternaryText: '#EBEBF52E',
    
    separator: '#38383A',
    opaqueSeparator: '#38383A',
    
    inputBackground: '#2C2C2E',
    inputBorder: '#3A3A3C',
    focusedInputBorder: '#2E7AFF',
    
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    info: '#0A84FF',
    
    budgetProgress: '#4DB399',
    overBudget: '#FF6666',
  }
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fonts: {
    light:    'Manrope-Light',
    regular:  'Manrope-Regular',
    medium:   'Manrope-Medium',
    semibold: 'Manrope-SemiBold',
    bold:     'Manrope-Bold',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
};

export const shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  }
};
