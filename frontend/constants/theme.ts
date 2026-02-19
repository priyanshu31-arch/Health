export const FONTS = {
  regular: 'Poppins_300Light',
  medium: 'Poppins_400Regular',
  semiBold: 'Poppins_500Medium',
  bold: 'Poppins_600SemiBold',
};

export const COLORS = {
  primary: '#0891B2', // Medical Teal/Cyan
  primaryLight: '#CFFAFE',
  primaryDark: '#0E7490',
  secondary: '#0F766E', // Deep Teal
  accent: '#06B6D4',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  gradient1: '#06B6D4',
  gradient2: '#0891B2',
  gradient3: '#0E7490',
};

export const Colors = {
  light: {
    text: COLORS.text,
    background: COLORS.background,
    tint: COLORS.primary,
    icon: COLORS.textLight,
    tabIconDefault: COLORS.textLight,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: COLORS.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: COLORS.primary,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};
