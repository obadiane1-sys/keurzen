import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGenerateInviteCode, useRecentCodes } from '../../../src/lib/queries/invitation-codes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
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
import type { InvitationCode } from '../../../src/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteScreen() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const { showToast } = useUiStore();
  const generateCode = useGenerateInviteCode();
  const { data: recentCodes } = useRecentCodes(currentHousehold?.id);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Success state
  const [sentResult, setSentResult] = useState<{
    email: string;
    code: string;
    emailSent: boolean;
  } | null>(null);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) { setEmailError(null); return false; }
    if (!EMAIL_REGEX.test(value.trim())) { setEmailError('Adresse email invalide'); return false; }
    setEmailError(null);
    return true;
  };

  const canSend =
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    !emailError &&
    EMAIL_REGEX.test(email.trim());

  const checkDuplicate = (): boolean => {
    if (!recentCodes) return false;
    const trimmedEmail = email.trim().toLowerCase();
    return recentCodes.some(
      (c) => c.email?.toLowerCase() === trimmedEmail && !c.used && new Date(c.expires_at) > new Date(),
    );
  };

  const doSend = async () => {
    if (generateCode.isPending) return;

    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedFirstName) { setError('Le prénom est requis'); return; }
    if (!trimmedEmail) { setError("L'adresse email est requise"); return; }
    if (!validateEmail(trimmedEmail)) return;

    setError(null);
    try {
      const result = await generateCode.mutateAsync({ email: trimmedEmail, firstName: trimmedFirstName });
      setSentResult({ email: trimmedEmail, code: result.code, emailSent: result.email_sent });
      setCopied(false);
      setFirstName('');
      setEmail('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSend = async () => {
    if (checkDuplicate()) {
      const trimmedEmail = email.trim().toLowerCase();
      if (Platform.OS === 'web') {
        if (window.confirm(`Un code actif existe deja pour ${trimmedEmail}. L'ancien code sera annule. Continuer ?`)) {
          await doSend();
        }
      } else {
        Alert.alert(
          'Code existant',
          `Un code actif existe deja pour ${trimmedEmail}. L'ancien code sera annule. Continuer ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Renvoyer', onPress: doSend },
          ],
        );
      }
      return;
    }
    await doSend();
  };

  const handleCopyCode = async () => {
    if (!sentResult) return;
    await Share.share({ message: `Rejoins mon foyer sur Keurzen ! Mon code d'invitation : ${sentResult.code}\nhttps://app.keurzen.app/join-code?code=${sentResult.code}` });
  };

  const getCodeStatus = (code: InvitationCode): { label: string; color: string } => {
    if (code.used) return { label: 'Utilise', color: Colors.blue };
    if (new Date(code.expires_at) < new Date()) return { label: 'Expire', color: Colors.textMuted };
    return { label: 'Actif', color: Colors.mint };
  };

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState variant="household" title="Pas de foyer" subtitle="Créez ou rejoignez un foyer avant d'inviter des membres." />
      </SafeAreaView>
    );
  }

  const avatarData = members.length > 0
    ? members.slice(0, 3).map((m) => ({ name: m.profile?.full_name ?? '?', color: m.color }))
    : [{ name: 'Julie', color: Colors.coral }, { name: 'Marc', color: Colors.mint }, { name: 'Eva', color: Colors.lavender }];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.heroHeader}>
          <Ionicons name="people" size={28} color={Colors.coral} />
          <Text style={styles.heroTitle}>Inviter un proche</Text>
        </View>
        <Text style={styles.heroSubtitle}>Ajoutez un membre à votre foyer. Il recevra un code par email pour rejoindre l'espace.</Text>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            {avatarData.map((a, i) => (
              <View key={i} style={[styles.avatarWrap, i > 0 && { marginLeft: -12 }]}>
                <Avatar name={a.name} color={a.color} size="lg" />
              </View>
            ))}
          </View>
          <Text style={styles.heroCardLabel}>{currentHousehold.name}</Text>
        </View>

        {/* ── Success state ──────────────────────────────────────────── */}
        {sentResult ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons
                name={sentResult.emailSent ? 'checkmark-circle' : 'alert-circle'}
                size={48}
                color={sentResult.emailSent ? Colors.mint : Colors.coral}
              />
            </View>

            <Text style={styles.successTitle}>
              {sentResult.emailSent ? 'Invitation envoyée !' : 'Code généré'}
            </Text>

            <Text style={styles.successSubtitle}>
              {sentResult.emailSent
                ? 'Un code à 6 chiffres a été envoyé à '
                : "L'email n'a pas pu être envoyé à "}
              <Text style={styles.successEmail}>{sentResult.email}</Text>
              {!sentResult.emailSent && '\nPartagez ce code manuellement :'}
            </Text>

            {/* Code display */}
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{sentResult.code}</Text>
            </View>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={16} color={Colors.navy} />
              <Text style={styles.copyBtnText}>Partager le code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendAnotherBtn} onPress={() => { setSentResult(null); }}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.coral} />
              <Text style={styles.sendAnotherText}>Inviter une autre personne</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Form ───────────────────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <Ionicons name="person-add" size={20} color={Colors.navy} />
              <Text style={styles.sectionTitle}>Inviter un membre</Text>
            </View>

            <TextInput
              style={[styles.input, error && !firstName.trim() && styles.inputError]}
              placeholder="Prénom"
              placeholderTextColor={Colors.textMuted}
              value={firstName}
              onChangeText={(text) => { setFirstName(text); if (error) setError(null); }}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, (emailError || (error && !email.trim())) && styles.inputError]}
              placeholder="Adresse email"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
                if (text.trim().length > 3) validateEmail(text);
                else setEmailError(null);
              }}
              onBlur={() => { if (email.trim()) validateEmail(email); }}
              returnKeyType="send"
              onSubmitEditing={canSend ? handleSend : undefined}
            />

            {emailError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.helperText}>Un code à 6 chiffres lui sera envoyé par email (valide 24h).</Text>

            <TouchableOpacity
              style={[styles.ctaButton, (!canSend || generateCode.isPending) && styles.ctaButtonDisabled]}
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

        {/* Recent codes — always visible */}
        {recentCodes && recentCodes.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Codes recents</Text>
            {recentCodes.slice(0, 5).map((c) => {
              const status = getCodeStatus(c);
              return (
                <View key={c.id} style={styles.recentRow}>
                  <Text style={styles.recentEmail}>{c.email ?? 'Sans email'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.bottomNote}>Vous pouvez inviter d'autres membres depuis les paramètres du foyer.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.base },
  backText: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.mint },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  heroTitle: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.navy, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: Typography.fontSize.base, color: Colors.navy + '99', lineHeight: 22, marginBottom: Spacing.xl },
  heroCard: { backgroundColor: Colors.lavender + '26', borderRadius: BorderRadius.xl, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'], gap: Spacing.base },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { borderWidth: 3, borderColor: Colors.background, borderRadius: BorderRadius.full, ...Shadows.sm },
  heroCardLabel: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.navy },

  successCard: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  successIcon: { marginBottom: Spacing.sm },
  successTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: Colors.navy },
  successSubtitle: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successEmail: { fontWeight: '700', color: Colors.navy },
  codeDisplay: { backgroundColor: Colors.backgroundSubtle, borderWidth: 2, borderColor: Colors.mint, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm },
  codeText: { fontSize: 32, fontWeight: '800', color: Colors.navy, letterSpacing: 8, textAlign: 'center' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base, marginTop: Spacing.xs },
  copyBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.navy },
  sendAnotherBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.base, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  sendAnotherText: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.coral },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.navy },
  input: { borderWidth: 1, borderColor: Colors.navy + '33', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, fontSize: Typography.fontSize.base, color: Colors.textPrimary, backgroundColor: Colors.backgroundCard, marginBottom: Spacing.md },
  inputError: { borderColor: Colors.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.error },
  helperText: { fontSize: Typography.fontSize.sm, color: Colors.navy + '80', marginBottom: Spacing.xl },
  ctaButton: { backgroundColor: Colors.coral, borderRadius: 30, height: 56, alignItems: 'center', justifyContent: 'center', ...Shadows.md, marginBottom: Spacing.xl },
  ctaButtonDisabled: { opacity: 0.5 },
  ctaText: { fontSize: Typography.fontSize.md, fontWeight: '700', color: Colors.textInverse, letterSpacing: 0.3 },
  bottomNote: { fontSize: Typography.fontSize.sm, color: Colors.navy + '66', textAlign: 'center', lineHeight: 20 },
  recentSection: { marginTop: Spacing['2xl'], width: '100%' },
  recentTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.navy, marginBottom: Spacing.md },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentEmail: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, flex: 1 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
});
