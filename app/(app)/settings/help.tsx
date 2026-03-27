import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Mascot } from '../../../src/components/ui/Mascot';
import { Ionicons } from '@expo/vector-icons';

const FAQ = [
  {
    q: 'Comment créer un foyer ?',
    a: 'Allez dans Paramètres > Mon foyer et appuyez sur "Créer un foyer". Vous pouvez ensuite inviter d\'autres membres via le code d\'invitation.',
  },
  {
    q: 'Comment fonctionne le bilan TLX ?',
    a: 'Le NASA-TLX mesure votre charge mentale perçue sur 6 dimensions. Vous pouvez le remplir une fois par semaine. Le score global va de 0 (légère) à 100 (très élevée).',
  },
  {
    q: 'Comment sont calculés les déséquilibres ?',
    a: 'Chaque semaine, Keurzen compare la part de tâches et de temps de chaque membre avec la part attendue (1 / nombre de membres). Un écart de plus de 20% génère une alerte.',
  },
  {
    q: 'Mes données sont-elles privées ?',
    a: 'Oui. Vos données ne sont accessibles qu\'aux membres de votre foyer. Consultez notre Politique de confidentialité pour plus de détails.',
  },
  {
    q: 'Comment récupérer mon mot de passe ?',
    a: 'Depuis l\'écran de connexion, appuyez sur "Mot de passe oublié ?" et entrez votre email. Si un compte existe, vous recevrez un lien de réinitialisation.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">{"Centre d'aide"}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.hero}>
          <Mascot size={80} expression="happy" color={Colors.blue} />
          <Text variant="h4" style={{ textAlign: 'center' }}>Comment pouvons-nous vous aider ?</Text>
        </View>

        <Text variant="h4">Questions fréquentes</Text>

        {FAQ.map((item, i) => (
          <Card key={i} onPress={() => setExpanded(expanded === i ? null : i)} style={{ gap: Spacing.sm }}>
            <View style={styles.faqRow}>
              <Text variant="label" style={{ flex: 1 }}>{item.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textMuted}
              />
            </View>
            {expanded === i && (
              <Text variant="body" color="secondary" style={{ lineHeight: 22 }}>
                {item.a}
              </Text>
            )}
          </Card>
        ))}

        <Card onPress={() => router.push('/(app)/settings/contact')}>
          <View style={styles.faqRow}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.coral + '25' }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label">Nous contacter</Text>
              <Text variant="caption" color="muted">Une question ? Écrivez-nous.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
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
  hero: { alignItems: 'center', gap: Spacing.base, paddingVertical: Spacing.lg },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  contactIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
});
