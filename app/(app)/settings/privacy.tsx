import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Confidentialité</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card>
          <Text variant="overline" color="muted">Dernière mise à jour : Mars 2025</Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Données collectées</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Keurzen collecte uniquement les données nécessaires au fonctionnement de l&apos;application :
            adresse email, nom, tâches, temps passé, bilans de charge mentale et dépenses du foyer.
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Accès aux données</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Vos données sont accessibles uniquement aux membres de votre foyer.
            Des règles de sécurité strictes (Row Level Security) sont appliquées
            au niveau de la base de données.
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Hébergement</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Les données sont hébergées via Supabase sur des serveurs situés dans l&apos;Union Européenne.
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Suppression</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Vous pouvez demander la suppression de vos données à tout moment en nous contactant
            à l&apos;adresse : support@keurzen.app
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Notifications push</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Les tokens de notification push sont stockés uniquement pour vous envoyer
            les rappels que vous avez configurés. Vous pouvez les désactiver dans les paramètres.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
});
