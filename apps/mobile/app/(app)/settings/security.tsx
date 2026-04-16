import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';

export default function SecurityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text variant="label" color="terracotta">
          ← Retour
        </Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text variant="h3" style={styles.title}>Sécurité</Text>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color={Colors.success} />
          <Text variant="body" color="secondary" style={styles.infoText}>
            Votre compte est sécurisé par authentification par email (code à usage unique).
            Aucun mot de passe n'est nécessaire.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  backBtn: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingTop: Spacing['2xl'],
    gap: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
  },
  infoCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  infoText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
