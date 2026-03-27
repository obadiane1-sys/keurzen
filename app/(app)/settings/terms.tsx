import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">{"Conditions d'utilisation"}</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card>
          <Text variant="overline" color="muted">Dernière mise à jour : Mars 2025</Text>
          <Text variant="body" style={{ lineHeight: 24, marginTop: Spacing.sm }}>
            En utilisant Keurzen, vous acceptez les présentes conditions d&apos;utilisation.
            L&apos;application est fournie pour un usage personnel et familial dans le but
            d&apos;améliorer l&apos;organisation domestique.
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Données personnelles</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Vos données sont hébergées de manière sécurisée. Elles ne sont partagées
            qu&apos;avec les membres de votre foyer et ne sont jamais vendues à des tiers.
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Responsabilité</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Keurzen est un outil d&apos;aide à l&apos;organisation. Les indicateurs présentés
            (TLX, déséquilibres) sont fournis à titre indicatif et ne constituent pas
            un avis médical ou psychologique.
          </Text>

          <Text variant="h4" style={{ marginTop: Spacing.base }}>Contact</Text>
          <Text variant="body" color="secondary" style={{ lineHeight: 24 }}>
            Pour toute question : support@keurzen.app
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
