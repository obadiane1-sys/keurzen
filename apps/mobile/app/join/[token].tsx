import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUiStore } from '../../src/stores/ui.store';
import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';

/**
 * Fallback screen for any old magic-link URL.
 *
 * Plan B hybride routes invitations through 6-digit codes detected
 * post-login on the dashboard (InvitationBanner). If a user clicks an
 * outdated /join/{token} URL we surface a calm "expired" message and
 * point them to signup or login — the banner will pick up their
 * pending invitation as soon as their email matches.
 */
export default function JoinScreen() {
  const router = useRouter();
  const setPendingInviteToken = useUiStore((s) => s.setPendingInviteToken);

  useEffect(() => {
    // Defensive: clear any leftover token from previous flows so the
    // (auth)/_layout doesn't bounce the user back here in a loop.
    setPendingInviteToken(null);
  }, [setPendingInviteToken]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Mascot size={100} expression="thinking" />

        <Text variant="h3" style={styles.title}>Lien expiré</Text>

        <Text variant="body" color="secondary" style={styles.subtitle}>
          Ce lien d&apos;invitation a expiré. Créez votre compte normalement
          et l&apos;invitation s&apos;affichera dans votre tableau de bord.
        </Text>

        <Button
          label="Créer mon compte"
          variant="primary"
          onPress={() => router.replace('/(auth)/signup')}
          style={styles.primaryBtn}
        />

        <Button
          label="J'ai déjà un compte"
          variant="ghost"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.secondaryBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
});
