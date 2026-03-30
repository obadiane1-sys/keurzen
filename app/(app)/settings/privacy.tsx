import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Confidentialite" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="overline" color="muted" style={styles.date}>
          Derniere mise a jour : 28 mars 2026
        </Text>

        <Section title="1. Responsable du traitement">
          L'application Keurzen est editee par Keurzen SAS. Le responsable du
          traitement des donnees personnelles est joignable a l'adresse :
          contact@keurzen.app
        </Section>

        <Section title="2. Donnees collectees">
          Nous collectons les donnees suivantes :{'\n'}
          - Adresse email (authentification){'\n'}
          - Nom complet (affichage dans le foyer){'\n'}
          - Photo de profil (optionnelle){'\n'}
          - Donnees de foyer : taches, temps, budget, evaluations TLX{'\n'}
          - Jeton de notification push (optionnel)
        </Section>

        <Section title="3. Finalites du traitement">
          Les donnees sont traitees pour :{'\n'}
          - Fournir le service de gestion de foyer{'\n'}
          - Calculer les statistiques de repartition des taches{'\n'}
          - Envoyer des notifications (si activees){'\n'}
          - Ameliorer le service
        </Section>

        <Section title="4. Base legale">
          Le traitement est fonde sur votre consentement (inscription) et sur
          l'execution du contrat (fourniture du service).
        </Section>

        <Section title="5. Hebergement et securite">
          Les donnees sont hebergees par Supabase (infrastructure AWS, region
          Europe). Les communications sont chiffrees en transit (TLS) et les
          donnees sont chiffrees au repos. L'acces aux donnees est protege par
          des regles de securite au niveau des lignes (Row Level Security).
        </Section>

        <Section title="6. Partage des donnees">
          Vos donnees ne sont jamais vendues. Elles sont partagees uniquement
          avec les membres de votre foyer dans le cadre du fonctionnement de
          l'application. Aucun tiers publicitaire n'a acces a vos donnees.
        </Section>

        <Section title="7. Duree de conservation">
          Les donnees sont conservees tant que votre compte est actif. Apres
          suppression de votre compte, les donnees sont effacees sous 30 jours.
        </Section>

        <Section title="8. Vos droits">
          Conformement au RGPD, vous disposez des droits suivants :{'\n'}
          - Droit d'acces a vos donnees{'\n'}
          - Droit de rectification{'\n'}
          - Droit a l'effacement{'\n'}
          - Droit a la portabilite{'\n'}
          - Droit d'opposition{'\n'}
          {'\n'}
          Pour exercer ces droits : contact@keurzen.app
        </Section>

        <Section title="9. Cookies">
          L'application mobile n'utilise pas de cookies. La version web utilise
          uniquement des cookies techniques necessaires a l'authentification.
        </Section>

        <Section title="10. Modifications">
          Cette politique peut etre mise a jour. Toute modification significative
          vous sera notifiee par email ou via l'application.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
