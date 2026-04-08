/**
 * Screen Template — Keurzen
 *
 * Usage : copier ce fichier comme point de depart pour un nouvel ecran.
 * Remplacer les placeholders entre [crochets].
 *
 * Checklist :
 * - [ ] Tokens uniquement (zero hardcode)
 * - [ ] 3 etats : loading, empty, error
 * - [ ] Touch targets >= 44px
 * - [ ] accessibilityRole sur les elements interactifs
 * - [ ] Equivalent web cree en parallele
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../../components/ui/Text';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

// import { use[Query] } from '../../lib/queries/[module]';

export default function [ScreenName]Screen() {
  // const { data, isLoading, error, refetch } = use[Query]();

  // --- Loading ---
  // if (isLoading) {
  //   return (
  //     <SafeAreaView style={styles.safe}>
  //       <View style={styles.centered}>
  //         <Loader />
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // --- Error ---
  // if (error) {
  //   return (
  //     <SafeAreaView style={styles.safe}>
  //       <EmptyState
  //         title="Erreur de chargement"
  //         description="Reessayez dans quelques instants"
  //         action={{ label: 'Reessayer', onPress: refetch }}
  //       />
  //     </SafeAreaView>
  //   );
  // }

  // --- Empty ---
  // if (!data?.length) {
  //   return (
  //     <SafeAreaView style={styles.safe}>
  //       <ScreenHeader title="[Titre]" />
  //       <EmptyState
  //         title="Rien ici pour le moment"
  //         description="[Message encourageant]"
  //       />
  //     </SafeAreaView>
  //   );
  // }

  // --- Content ---
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="[Titre]" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenu de l'ecran */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
