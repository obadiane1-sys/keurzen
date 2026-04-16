import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, TouchTarget } from '../../constants/tokens';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      isPassword = false,
      secureTextEntry,
      style,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isSecure = isPassword ? !showPassword : secureTextEntry;

    const borderColor = error
      ? Colors.error
      : focused
      ? Colors.borderFocus
      : Colors.border;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text variant="label" style={styles.label}>
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputWrapper,
            { borderColor },
            focused && styles.inputFocused,
          ]}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={18}
              color={focused ? Colors.borderFocus : Colors.textMuted}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon && styles.inputWithLeft,
              (rightIcon || isPassword) && styles.inputWithRight,
              style,
            ]}
            placeholderTextColor={Colors.textMuted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={isSecure}
            accessibilityLabel={label}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.rightIcon}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              accessibilityRole="button"
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}

          {rightIcon && !isPassword && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIcon}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={rightIcon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <Text variant="caption" color="error" style={styles.message}>
            {error}
          </Text>
        )}
        {hint && !error && (
          <Text variant="caption" color="muted" style={styles.message}>
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    minHeight: TouchTarget.min,
  },
  inputFocused: {
    backgroundColor: Colors.inputFocusedBg,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    minHeight: TouchTarget.min,
  },
  inputWithLeft: {
    paddingLeft: Spacing.xs,
  },
  inputWithRight: {
    paddingRight: Spacing.xs,
  },
  leftIcon: {
    marginLeft: Spacing.base,
  },
  rightIcon: {
    paddingHorizontal: Spacing.base,
    minWidth: TouchTarget.min,
    alignItems: 'center',
  },
  message: {
    marginTop: 2,
  },
});
