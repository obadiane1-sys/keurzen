import React, { useRef, useCallback, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

const OTP_SIZE = 52;

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  hasError?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  autoFocus = true,
  hasError = false,
}: OTPInputProps) {
  const digits = value.padEnd(length, ' ').split('').slice(0, length);
  const inputs = useRef<Array<TextInput | null>>(Array(length).fill(null));

  useEffect(() => {
    if (autoFocus) {
      const focusIndex = Math.min(value.length, length - 1);
      setTimeout(() => inputs.current[focusIndex]?.focus(), 50);
    }
  }, [autoFocus, length, value.length]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Handle paste of full code
      const cleaned = text.replace(/[^0-9]/g, '');
      if (cleaned.length === length) {
        onChange(cleaned);
        inputs.current[length - 1]?.focus();
        return;
      }

      const digit = cleaned.slice(-1);
      const next = digits.slice();
      if (digit) {
        next[index] = digit;
        const newValue = next.join('').replace(/ /g, '');
        onChange(newValue);
        if (index < length - 1) {
          inputs.current[index + 1]?.focus();
        }
      } else {
        next[index] = '';
        const newValue = next.join('').replace(/ /g, '');
        onChange(newValue);
      }
    },
    [digits, length, onChange],
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          style={[
            styles.input,
            digit.trim() ? styles.inputFilled : null,
            hasError ? styles.inputError : null,
          ]}
          value={digit.trim()}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={length} // allow paste on first field
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? (Platform.OS === 'android' ? 'sms-otp' : 'one-time-code') : 'off'}
          caretHidden
          accessible
          accessibilityLabel={`Chiffre ${i + 1} du code`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  input: {
    width: OTP_SIZE,
    height: OTP_SIZE,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    textAlign: 'center',
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0F',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '0F',
  },
});
