import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Mascot } from '../../../src/components/ui/Mascot';
import { Avatar } from '../../../src/components/ui/Avatar';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { useUpdateMemberProfile } from '../../../src/lib/queries/household';

const STEPS = ['welcome', 'profile', 'orientation'] as const;
type Step = typeof STEPS[number];

export default function PostJoinOnboardingScreen() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const { user } = useAuthStore();
  const { markJoinOnboardingComplete } = useUiStore();
  const updateProfile = useUpdateMemberProfile();

  const [step, setStep] = useState<Step>('welcome');

  // Profile setup state
  const currentMember = members.find((m) => m.user_id === user?.id);
  const [fullName, setFullName] = useState(
    currentMember?.profile?.full_name ?? ''
  );
  const [selectedColor, setSelectedColor] = useState(
    currentMember?.color ?? Colors.memberColors[0]
  );

  const householdName = currentHousehold?.name ?? 'votre foyer';
  const otherMembers = members.filter((m) => m.user_id !== user?.id);

  const handleFinish = () => {
    if (currentHousehold) {
      markJoinOnboardingComplete(currentHousehold.id);
    }
    router.replace('/(app)/dashboard');
  };

  const handleSaveProfile = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) return;

    try {
      await updateProfile.mutateAsync({ fullName: trimmedName, color: selectedColor });
      setStep('orientation');
    } catch {
      // Silently continue — profile can be updated later in settings
      setStep('orientation');
    }
  };

  // ─── Step 1: Welcome ──────────────────────────────────────────────────────

  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.centered} showsVerticalScrollIndicator={false}>
          <Mascot size={120} expression="happy" />

          <Text variant="h2" style={styles.title}>
            Bienvenue dans {householdName} !
          </Text>

          {otherMembers.length > 0 && (
            <View style={styles.memberRow}>
              {otherMembers.slice(0, 4).map((m) => (
                <Avatar
                  key={m.id}
                  name={m.profile?.full_name}
                  color={m.color}
                  size="lg"
                />
              ))}
            </View>
          )}

          {otherMembers.length > 0 && (
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {otherMembers.map((m) => m.profile?.full_name ?? 'Membre').join(', ')}{' '}
              {otherMembers.length === 1 ? 'vous attend' : 'vous attendent'} !
            </Text>
          )}

          <Button
            label="Configurer mon profil"
            onPress={() => setStep('profile')}
            fullWidth
            size="lg"
            style={styles.cta}
          />

          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text variant="bodySmall" color="muted">Passer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Step 2: Profile setup ────────────────────────────────────────────────

  if (step === 'profile') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.profileContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text variant="h2" style={styles.profileTitle}>Votre profil</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Comment souhaitez-vous apparaitre dans le foyer ?
          </Text>

          {/* Preview */}
          <View style={styles.previewRow}>
            <Avatar name={fullName || '?'} color={selectedColor} size="xl" />
            <Text variant="h4" style={{ marginTop: Spacing.sm }}>
              {fullName || 'Votre prenom'}
            </Text>
          </View>

          {/* Name input */}
          <TextInput
            style={styles.input}
            placeholder="Prenom"
            placeholderTextColor={Colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Color picker */}
          <Text variant="label" style={styles.colorLabel}>Couleur</Text>
          <View style={styles.colorRow}>
            {Colors.memberColors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
                activeOpacity={0.7}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Continuer"
            onPress={handleSaveProfile}
            isLoading={updateProfile.isPending}
            fullWidth
            size="lg"
            style={styles.cta}
            disabled={!fullName.trim()}
          />

          <TouchableOpacity onPress={() => setStep('orientation')} style={styles.skipBtn}>
            <Text variant="bodySmall" color="muted">Passer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Step 3: Orientation ──────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.centered} showsVerticalScrollIndicator={false}>
        <Mascot size={100} expression="calm" />

        <Text variant="h2" style={styles.title}>
          Keurzen en 3 points
        </Text>

        <View style={styles.bulletList}>
          <BulletPoint
            icon="swap-horizontal-outline"
            text="Repartir les taches du foyer equitablement"
          />
          <BulletPoint
            icon="people-outline"
            text="Suivre qui fait quoi, sans prise de tete"
          />
          <BulletPoint
            icon="heart-outline"
            text="Mesurer la charge mentale pour mieux s'equilibrer"
          />
        </View>

        <Button
          label="Commencer"
          onPress={handleFinish}
          fullWidth
          size="lg"
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Bullet Point Component ───────────────────────────────────────────────────

function BulletPoint({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletIcon}>
        <Ionicons name={icon} size={20} color={Colors.mint} />
      </View>
      <Text variant="body" style={styles.bulletText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
  },
  memberRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  cta: {
    marginTop: Spacing.xl,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  profileContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
  },
  profileTitle: {
    marginBottom: Spacing.xs,
  },
  previewRow: {
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.xl,
  },
  colorLabel: {
    marginBottom: Spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.navy,
  },
  bulletList: {
    width: '100%',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bulletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mint + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
});
