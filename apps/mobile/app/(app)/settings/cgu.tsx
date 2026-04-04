import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';

export default function CGUScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Conditions d'utilisation" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="overline" color="muted" style={styles.date}>
          Derniere mise a jour : 28 mars 2026
        </Text>

        <Section title="1. Objet">
          Keurzen est une application de gestion du foyer visant a repartir
          equitablement les taches domestiques entre les membres d'un meme foyer.
          Les presentes conditions regissent l'utilisation de l'application.
        </Section>

        <Section title="2. Inscription et compte">
          L'inscription est gratuite. Vous etes responsable de la confidentialite
          de vos identifiants. Toute activite realisee via votre compte est
          presumee etre de votre fait. Vous pouvez supprimer votre compte a tout
          moment depuis les parametres de l'application.
        </Section>

        <Section title="3. Utilisation du service">
          Vous vous engagez a utiliser Keurzen de maniere loyale et
          respectueuse. Il est interdit de tenter de perturber le fonctionnement
          du service, d'acceder aux donnees d'autres utilisateurs ou d'utiliser
          l'application a des fins illegales.
        </Section>

        <Section title="4. Donnees personnelles">
          Les donnees collectees sont strictement necessaires au fonctionnement
          de l'application : adresse email, nom, donnees de foyer et taches.
          Consultez notre Politique de confidentialite pour plus de details.
        </Section>

        <Section title="5. Propriete intellectuelle">
          L'application Keurzen, son design, son code et son contenu sont
          proteges par le droit d'auteur. Toute reproduction ou reutilisation
          sans autorisation prealable est interdite.
        </Section>

        <Section title="6. Limitation de responsabilite">
          Keurzen est fourni "en l'etat". Nous ne garantissons pas que le
          service sera exempt d'interruptions ou d'erreurs. En aucun cas notre
          responsabilite ne saurait etre engagee pour des dommages indirects lies
          a l'utilisation de l'application.
        </Section>

        <Section title="7. Modification des CGU">
          Nous nous reservons le droit de modifier les presentes conditions.
          Les utilisateurs seront informes de toute modification importante.
          L'utilisation continue du service apres modification vaut acceptation.
        </Section>

        <Section title="8. Contact">
          Pour toute question relative aux presentes conditions, vous pouvez
          nous contacter a l'adresse : contact@keurzen.app
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <>
      <Text variant="h4" style={styles.sectionTitle}>
        {title}
      </Text>
      <Text variant="body" color="secondary" style={styles.sectionBody}>
        {children}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.sm,
  },
  date: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginTop: Spacing.base,
  },
  sectionBody: {
    lineHeight: 22,
  },
});
