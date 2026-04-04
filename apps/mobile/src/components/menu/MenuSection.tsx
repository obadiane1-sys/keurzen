import React, { Children, cloneElement, isValidElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, BorderRadius, Spacing } from '../../constants/tokens';

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export function MenuSection({ title, children }: MenuSectionProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.container}>
      <Text variant="caption" weight="semibold" style={styles.title}>
        {title}
      </Text>
      <View style={styles.card}>
        {items.map((child, i) =>
          cloneElement(child as React.ReactElement<{ showDivider?: boolean }>, {
            showDivider: i < items.length - 1,
          }),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
