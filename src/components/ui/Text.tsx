import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/tokens';

type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'overline';

type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'mint' | 'coral' | 'lavender' | 'navy' | 'error' | 'success';

interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
  selectable?: boolean;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: { fontSize: Typography.fontSize['5xl'], fontWeight: '800', lineHeight: Typography.fontSize['5xl'] * 1.1 },
  h1: { fontSize: Typography.fontSize['4xl'], fontWeight: '700', lineHeight: Typography.fontSize['4xl'] * 1.2 },
  h2: { fontSize: Typography.fontSize['3xl'], fontWeight: '700', lineHeight: Typography.fontSize['3xl'] * 1.25 },
  h3: { fontSize: Typography.fontSize['2xl'], fontWeight: '600', lineHeight: Typography.fontSize['2xl'] * 1.3 },
  h4: { fontSize: Typography.fontSize.xl, fontWeight: '600', lineHeight: Typography.fontSize.xl * 1.35 },
  body: { fontSize: Typography.fontSize.base, fontWeight: '400', lineHeight: Typography.fontSize.base * 1.6 },
  bodySmall: { fontSize: Typography.fontSize.sm, fontWeight: '400', lineHeight: Typography.fontSize.sm * 1.6 },
  label: { fontSize: Typography.fontSize.md, fontWeight: '500', lineHeight: Typography.fontSize.md * 1.4 },
  caption: { fontSize: Typography.fontSize.xs, fontWeight: '400', lineHeight: Typography.fontSize.xs * 1.5 },
  overline: { fontSize: Typography.fontSize.xs, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
};

const colorMap: Record<TextColor, string> = {
  primary: Colors.textPrimary,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  inverse: Colors.textInverse,
  mint: Colors.mint,
  coral: Colors.coral,
  lavender: Colors.lavender,
  navy: Colors.navy,
  error: Colors.error,
  success: Colors.success,
};

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  style,
  children,
  numberOfLines,
  selectable,
}: TextProps) {
  const weightStyle: TextStyle | undefined = weight
    ? { fontWeight: Typography.fontWeight[weight] as TextStyle['fontWeight'] }
    : undefined;

  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        { color: colorMap[color] },
        weightStyle,
        style,
      ]}
      numberOfLines={numberOfLines}
      selectable={selectable}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
});
