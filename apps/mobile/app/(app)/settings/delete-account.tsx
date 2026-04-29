import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { deleteAccount } from '../../../src/lib/supabase/auth';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const resetAuth = useAuthStore((s) => s.reset);
  const resetHousehold = useHouseholdStore((s) => s.reset);
  const { showToast, setPendingInviteToken, setPendingInviteCode } = useUiStore();

  const [emailInput, setEmailInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedEmail = profile?.email?.trim().toLowerCase() ?? '';
  const matches = emailInput.trim().toLowerCase() === expectedEmail && expectedEmail.length > 0;

  const performDelete = async () => {
    setIsDeleting(true);

    const result = await deleteAccount();

    if (result.error) {
      setIsDeleting(false);

      if (result.code === 'has_co_members') {
        const goHousehold = () => router.replace('/(app)/settings/household');
        if (Platform.OS === 'web') {
          if (window.confirm(`${result.error}\n\nGerer les membres ?`)) goHousehold();
          return;
        }
        Alert.alert(
          'Foyer non vide',
          result.error,
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Gerer les membres', onPress: goHousehold },
          ],
        );
        return;
      }

      const msg = result.error || 'Suppression impossible. Reessayez plus tard.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Erreur', msg);
      }
      return;
    }

    // Success: reset everything and bounce back to login
    setPendingInviteToken(null);
    setPendingInviteCode(null);
    resetHousehold();
    resetAuth();
    showToast('Compte supprime', 'success');
    router.replace('/(auth)/login');
  };

  const confirmDelete = () => {
    if (!matches || isDeleting) return;

    if (Platform.OS === 'web') {
      if (window.confirm('Cette action est irreversible. Confirmer la suppression ?')) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      'Supprimer definitivement le compte ?',
      "Cette action est irreversible. Toutes vos donnees personnelles seront effacees.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: performDelete,
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isDeleting}
      >
        <Text variant="label" color="primary">← Retour</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="h2" style={styles.title}>Supprimer mon compte</Text>

          <Card style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={22} color={Colors.error} />
              <Text variant="body" weight="semibold">
                Action irreversible
              </Text>
            </View>
            <Text variant="bodySmall" color="secondary" style={styles.warningBody}>
              Une fois supprime, votre compte ne peut pas etre recupere.
            </Text>
          </Card>

          <View style={styles.section}>
            <Text variant="label" weight="semibold" style={styles.sectionTitle}>
              Ce qui sera supprime
            </Text>
            <BulletItem text="Votre profil et vos preferences" />
            <BulletItem text="Vos statistiques personnelles, TLX et logs de temps" />
            <BulletItem text="Vos taches et notifications" />
            <BulletItem text="Si vous etes seul·e dans votre foyer : le foyer et son contenu" />
          </View>

          <View style={styles.section}>
            <Text variant="label" weight="semibold" style={styles.sectionTitle}>
              Ce qui sera anonymise
            </Text>
            <BulletItem text="Vos messages dans les conversations partagees" />
            <BulletItem text="Vos plats planifies dans les repas du foyer" />
            <Text variant="caption" color="muted" style={styles.sectionFootnote}>
              Pour preserver l'historique des autres membres.
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="label" weight="semibold" style={styles.sectionTitle}>
              Confirmer en saisissant votre email
            </Text>
            <Input
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder={expectedEmail || 'votre@email.com'}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isDeleting}
              accessibilityLabel="Confirmation par email"
            />
          </View>

          <Button
            label="Supprimer definitivement mon compte"
            variant="danger"
            onPress={confirmDelete}
            disabled={!matches}
            isLoading={isDeleting}
            fullWidth
            style={styles.deleteBtn}
          />

          <Text variant="caption" color="muted" style={styles.legal}>
            Conformement au RGPD, vos donnees personnelles seront effacees
            immediatement de nos systemes.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot} />
      <Text variant="bodySmall" color="secondary" style={styles.bulletText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  flex: { flex: 1 },
  backBtn: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  content: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
  },
  warningCard: {
    backgroundColor: Colors.accent + '22',
    borderColor: Colors.error,
    borderWidth: 1.5,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warningBody: {
    lineHeight: 20,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionFootnote: {
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.textMuted,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    lineHeight: 20,
  },
  deleteBtn: {
    marginTop: Spacing.sm,
  },
  legal: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});
