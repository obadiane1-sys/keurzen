import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, Shadows, TouchTarget } from '../../constants/tokens';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

const variantConfig: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, text: Colors.textInverse },
  secondary: { bg: Colors.success, text: Colors.textInverse },
  ghost: { bg: 'transparent', text: Colors.textPrimary },
  danger: { bg: Colors.error, text: Colors.textInverse },
  outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
};

const sizeConfig: Record<ButtonSize, { height: number; px: number; fontSize: number; radius: number }> = {
  sm: { height: 36, px: Spacing.md, fontSize: Typography.fontSize.sm, radius: BorderRadius.md },
  md: { height: TouchTarget.min, px: Spacing.lg, fontSize: Typography.fontSize.base, radius: BorderRadius.lg },
  lg: { height: 54, px: Spacing.xl, fontSize: Typography.fontSize.md, radius: BorderRadius.xl },
};

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  label,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const vc = variantConfig[variant];
  const sc = sizeConfig[size];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[
        styles.base,
        {
          backgroundColor: vc.bg,
          height: sc.height,
          paddingHorizontal: sc.px,
          borderRadius: sc.radius,
          borderWidth: vc.border ? 1.5 : 0,
          borderColor: vc.border,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? undefined : 'flex-start',
          width: fullWidth ? '100%' : undefined,
        },
        variant !== 'ghost' && Shadows.sm,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={vc.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <Text
            style={{ fontSize: sc.fontSize, color: vc.text }}
            weight="semibold"
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
