import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, TextProps as RNTextProps } from 'react-native';
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

type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'mint' | 'coral' | 'lavender' | 'navy' | 'error' | 'success' | 'terracotta' | 'sauge' | 'prune';

export interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  style?: TextStyle | (TextStyle | undefined)[];
  children: React.ReactNode;
  numberOfLines?: number;
  selectable?: boolean;
  className?: string;
  onPress?: () => void;
}

// Map numeric fontWeight to the correct Nunito fontFamily name.
// On Android, fontWeight alone doesn't select the right font file —
// we must set fontFamily explicitly.
const weightToFamily: Record<string, string> = {
  '400': Typography.fontFamily.regular,
  '500': Typography.fontFamily.medium,
  '600': Typography.fontFamily.semibold,
  '700': Typography.fontFamily.bold,
  '800': Typography.fontFamily.extrabold,
  normal: Typography.fontFamily.regular,
  bold: Typography.fontFamily.bold,
};

function resolveFontFamily(fontWeight: TextStyle['fontWeight']): string {
  if (!fontWeight) return Typography.fontFamily.regular;
  return weightToFamily[String(fontWeight)] ?? Typography.fontFamily.regular;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: { fontSize: Typography.fontSize['5xl'], fontFamily: Typography.fontFamily.extrabold, lineHeight: Typography.fontSize['5xl'] * 1.1 },
  h1: { fontSize: Typography.fontSize['4xl'], fontFamily: Typography.fontFamily.bold, lineHeight: Typography.fontSize['4xl'] * 1.2 },
  h2: { fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.bold, lineHeight: Typography.fontSize['3xl'] * 1.25 },
  h3: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semibold, lineHeight: Typography.fontSize['2xl'] * 1.3 },
  h4: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semibold, lineHeight: Typography.fontSize.xl * 1.35 },
  body: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, lineHeight: Typography.fontSize.base * 1.6 },
  bodySmall: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, lineHeight: Typography.fontSize.sm * 1.6 },
  label: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.medium, lineHeight: Typography.fontSize.md * 1.4 },
  caption: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, lineHeight: Typography.fontSize.xs * 1.5 },
  overline: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semibold, letterSpacing: 1.5, textTransform: 'uppercase' },
};

const colorMap: Record<TextColor, string> = {
  primary: Colors.textPrimary,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  inverse: Colors.textInverse,
  mint: Colors.sauge,
  coral: Colors.rose,
  lavender: Colors.prune,
  navy: Colors.textPrimary,
  error: Colors.error,
  success: Colors.success,
  terracotta: Colors.terracotta,
  sauge: Colors.sauge,
  prune: Colors.prune,
};

// Map named weight prop to fontFamily
const namedWeightToFamily: Record<string, string> = {
  regular: Typography.fontFamily.regular,
  medium: Typography.fontFamily.medium,
  semibold: Typography.fontFamily.semibold,
  bold: Typography.fontFamily.bold,
  extrabold: Typography.fontFamily.extrabold,
};

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  style,
  children,
  numberOfLines,
  selectable,
  className,
  onPress,
}: TextProps) {
  const weightStyle: TextStyle | undefined = weight
    ? { fontFamily: namedWeightToFamily[weight] }
    : undefined;

  // If inline style overrides fontWeight, resolve it to the correct fontFamily
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  const inlineFontOverride: TextStyle | undefined =
    flatStyle?.fontWeight && !flatStyle?.fontFamily
      ? { fontFamily: resolveFontFamily(flatStyle.fontWeight), fontWeight: undefined }
      : undefined;

  return (
    <RNText
      className={className}
      style={[
        variantStyles[variant],
        { color: colorMap[color] },
        weightStyle,
        style,
        inlineFontOverride,
      ]}
      numberOfLines={numberOfLines}
      selectable={selectable}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
}
