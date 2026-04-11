import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { ColorsV2, RadiusV2 } from '../../constants/tokensV2';
import { Spacing } from '../../constants/tokens';

export function HomeHeartCard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" style={styles.question}>
        Que voulez-vous faire ?
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(app)/tasks/create')}
          activeOpacity={0.8}
        >
          <Text variant="bodySmall" weight="semibold" style={styles.primaryButtonText}>
            Ajouter une tache
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(app)/dashboard/tlx')}
          activeOpacity={0.8}
        >
          <Text variant="bodySmall" weight="semibold" style={styles.secondaryButtonText}>
            Remplir le TLX
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ColorsV2.tertiaryContainer,
    borderRadius: RadiusV2.md,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    marginLeft: 40,
  },
  question: {
    color: ColorsV2.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: ColorsV2.primary,
    borderRadius: RadiusV2.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  primaryButtonText: {
    color: ColorsV2.onPrimary,
  },
  secondaryButton: {
    backgroundColor: ColorsV2.surfaceContainerLowest,
    borderRadius: RadiusV2.xl,
    borderWidth: 1,
    borderColor: ColorsV2.outlineVariant,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    color: ColorsV2.onSurface,
  },
});
