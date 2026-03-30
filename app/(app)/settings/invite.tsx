import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGenerateInviteCode } from '../../../src/lib/queries/invitation-codes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Avatar } from '../../../src/components/ui/Avatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';

const PREVIEW_MEMBERS = [
  { name: 'Julie', color: Colors.coral },
  { name: 'Marc', color: Colors.mint },
  { name: 'Eva', color: Colors.lavender },
];

export default function InviteScreen() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const generateCode = useGenerateInviteCode();

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);

  const canSend = firstName.trim().length > 0 && email.trim().length > 0;

  const handleSend = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFirstName) {
      setError('Le prenom est requis');
      return;
    }
    if (!trimmedEmail) {
      setError('L\'adresse email est requise');
      return;
    }

    setError(null);
    try {
      await generateCode.mutateAsync({
        email: trimmedEmail,
        firstName: trimmedFirstName,
      });

      setSentToEmail(trimmedEmail);
      setFirstName('');
      setEmail('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          variant="household"
          title="Pas de foyer"
          subtitle="Creez ou rejoignez un foyer avant d'inviter des membres."
        />
      </SafeAreaView>
    );
  }

  // Use real members if available, fallback to preview
  const avatarData =
    members.length > 0
      ? members.slice(0, 3).map((m) => ({
          name: (m as any).profile?.full_name ?? '?',
          color: m.color,
        }))
      : PREVIEW_MEMBERS;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Skip */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.skipBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>

        {/* Hero title */}
        <View style={styles.heroHeader}>
          <Ionicons name="people" size={28} color={Colors.coral} />
          <Text style={styles.heroTitle}>Inviter un proche</Text>
        </View>

        <Text style={styles.heroSubtitle}>
          Ajoutez un membre a votre foyer. Il recevra un code par email pour
          rejoindre l'espace.
        </Text>

        {/* Hero illustration card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            {avatarData.map((a, i) => (
              <View
                key={i}
                style={[styles.avatarWrap, i > 0 && { marginLeft: -12 }]}
              >
                <Avatar name={a.name} color={a.color} size="lg" />
              </View>
            ))}
          </View>
          <Text style={styles.heroCardLabel}>
            {currentHousehold.name}
          </Text>
        </View>

        {/* Success state */}
        {sentToEmail ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.mint} />
            </View>
            <Text style={styles.successTitle}>Invitation envoyee !</Text>
            <Text style={styles.successSubtitle}>
              Un code a 6 chiffres a ete envoye a{' '}
              <Text style={styles.successEmail}>{sentToEmail}</Text>
            </Text>
            <TouchableOpacity
              style={styles.sendAnotherBtn}
              onPress={() => setSentToEmail(null)}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.coral} />
              <Text style={styles.sendAnotherText}>Inviter une autre personne</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Ionicons name="person-add" size={20} color={Colors.navy} />
              <Text style={styles.sectionTitle}>Inviter un membre</Text>
            </View>

            {/* Name input */}
            <TextInput
              style={[styles.input, error && !firstName.trim() && styles.inputError]}
              placeholder="Prenom"
              placeholderTextColor={Colors.textMuted}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (error) setError(null);
              }}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Email input */}
            <TextInput
              style={[styles.input, error && !email.trim() && styles.inputError]}
              placeholder="Adresse email"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              returnKeyType="send"
              onSubmitEditing={canSend ? handleSend : undefined}
            />

            {/* Error */}
            {error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Helper text */}
            <Text style={styles.helperText}>
              Un code a 6 chiffres lui sera envoye par email.
            </Text>

            {/* CTA */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                (!canSend || generateCode.isPending) && styles.ctaButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!canSend || generateCode.isPending}
              activeOpacity={0.85}
            >
              {generateCode.isPending ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Text style={styles.ctaText}>Envoyer l'invitation</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Bottom note */}
        <Text style={styles.bottomNote}>
          Vous pouvez inviter d'autres membres depuis les parametres du foyer.
        </Text>
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
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },

  // Skip
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.base,
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.navy,
    textDecorationLine: 'underline',
  },

  // Hero
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.navy,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.navy + '99', // 60% opacity
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.lavender + '26', // 15% opacity
    borderRadius: BorderRadius.xl,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.base,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    borderWidth: 3,
    borderColor: Colors.background,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  heroCardLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.navy,
  },

  // Success state
  successCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  successIcon: {
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.navy,
  },
  successSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    fontWeight: '700',
    color: Colors.navy,
  },
  sendAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  sendAnotherText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.coral,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.navy,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: Colors.navy + '33', // 20% opacity
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
  },

  // Helper
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.navy + '80', // 50% opacity
    marginBottom: Spacing.xl,
  },

  // CTA
  ctaButton: {
    backgroundColor: Colors.coral,
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    marginBottom: Spacing.xl,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },

  // Bottom note
  bottomNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.navy + '66', // 40% opacity
    textAlign: 'center',
    lineHeight: 20,
  },
});
