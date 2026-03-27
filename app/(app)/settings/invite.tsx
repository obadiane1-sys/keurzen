import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHouseholdStore } from '../../../src/stores/household.store';
import {
  useCreateInvitation,
  useRevokeInvitation,
  usePendingInvitations,
  useSendEmailInvitation,
} from '../../../src/lib/queries/household';
import { useUiStore } from '../../../src/stores/ui.store';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Divider } from '../../../src/components/ui/Divider';
import { Mascot } from '../../../src/components/ui/Mascot';
import { Ionicons } from '@expo/vector-icons';
import type { Household, Invitation } from '../../../src/types';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInviteLink(token: string): string {
  return `https://app.keurzen.app/join/${token}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Channel labels/icons ─────────────────────────────────────────────────────

const CHANNEL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  link:  'link-outline',
  email: 'mail-outline',
};

const CHANNEL_LABEL: Record<string, string> = {
  link:  'Lien',
  email: 'E-mail',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

type ActiveSection = null | 'email' | 'link';

export default function InviteScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guardCenter}>
          <Mascot size={80} expression="thinking" />
          <Text variant="h4" style={styles.guardTitle}>Aucun foyer associé</Text>
          <Text variant="body" color="secondary" style={styles.guardSubtitle}>
            {'Créez ou rejoignez un foyer avant d\'inviter un membre.'}
          </Text>
          <Button
            label="Retour"
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Inviter un membre</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Household badge */}
        <View style={styles.householdBadge}>
          <Ionicons name="home-outline" size={14} color={Colors.textMuted} />
          <Text variant="caption" color="muted">{currentHousehold.name}</Text>
        </View>

        {/* Action rows */}
        <Card>
          <ActionRow
            icon="mail-outline"
            iconColor={Colors.blue}
            iconBg={Colors.blue + '18'}
            label="Inviter par e-mail"
            sublabel="Envoyer un lien par e-mail"
            active={activeSection === 'email'}
            onPress={() => setActiveSection(activeSection === 'email' ? null : 'email')}
          />
          <Divider />
          <ActionRow
            icon="link-outline"
            iconColor={Colors.coral}
            iconBg={Colors.coral + '18'}
            label="Partager un lien"
            sublabel="Lien sécurisé, valable 7 jours"
            active={activeSection === 'link'}
            onPress={() => setActiveSection(activeSection === 'link' ? null : 'link')}
          />
        </Card>

        {/* Inline section */}
        {activeSection === 'email' && (
          <EmailSection
            household={currentHousehold}
            onDone={() => setActiveSection(null)}
          />
        )}
        {activeSection === 'link' && (
          <LinkSection
            household={currentHousehold}
            onDone={() => setActiveSection(null)}
          />
        )}

        {/* Pending invitations */}
        <PendingInvitationsSection householdId={currentHousehold.id} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({
  icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, active && styles.actionRowActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.actionText}>
        <Text variant="label">{label}</Text>
        <Text variant="caption" color="muted">{sublabel}</Text>
      </View>
      <Ionicons
        name={active ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

// ─── Email Section ────────────────────────────────────────────────────────────

function EmailSection({
  onDone,
}: {
  household: Household;
  onDone: () => void;
}) {
  const { showToast } = useUiStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sendInvitation = useSendEmailInvitation();

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Adresse e-mail invalide');
      return;
    }
    setEmailError('');
    try {
      await sendInvitation.mutateAsync({ email: email.trim() });
      setSentTo(email.trim());
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur lors de l'envoi", 'error');
    }
  };

  if (sentTo) {
    return (
      <Card style={styles.sectionCard}>
        <View style={styles.successRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.mint} />
          <View style={{ flex: 1 }}>
            <Text variant="label">Invitation envoyée !</Text>
            <Text variant="caption" color="muted">{sentTo}</Text>
          </View>
        </View>
        <Button
          label="Inviter une autre personne"
          onPress={() => { setSentTo(null); setEmail(''); onDone(); }}
          variant="ghost"
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />
      </Card>
    );
  }

  return (
    <Card style={styles.sectionCard}>
      <Input
        label="E-mail du destinataire"
        placeholder="marie@exemple.fr"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        leftIcon="mail-outline"
        value={email}
        onChangeText={(v) => { setEmail(v); setEmailError(''); }}
        error={emailError}
      />
      <Button
        label="Envoyer l'invitation"
        onPress={handleSend}
        isLoading={sendInvitation.isPending}
        disabled={!email.trim()}
        variant="primary"
        fullWidth
        leftIcon={<Ionicons name="send-outline" size={16} color={Colors.textInverse} />}
        style={{ marginTop: Spacing.sm }}
      />
    </Card>
  );
}

// ─── Link Section ─────────────────────────────────────────────────────────────

function LinkSection({
  household,
  onDone,
}: {
  household: Household;
  onDone: () => void;
}) {
  const { showToast } = useUiStore();
  const [link, setLink] = useState<string | null>(null);
  const createInvitation = useCreateInvitation();

  const handleGenerateAndShare = async () => {
    try {
      const inv = await createInvitation.mutateAsync({ channel: 'link' });
      const url = buildInviteLink(inv.token);
      setLink(url);
      await Share.share({
        message: `Rejoins mon foyer "${household.name}" sur Keurzen !\n\n${url}`,
        title: 'Invitation Keurzen',
        url,
      });
    } catch (err: unknown) {
      if ((err as Error)?.message !== 'Share was dismissed') {
        showToast(err instanceof Error ? err.message : 'Impossible de générer le lien', 'error');
      }
    }
  };

  const handleShare = async () => {
    if (!link) return;
    try {
      await Share.share({
        message: `Rejoins mon foyer "${household.name}" sur Keurzen !\n\n${link}`,
        title: 'Invitation Keurzen',
        url: link,
      });
    } catch {
      // L'utilisateur a annulé
    }
  };

  if (link) {
    return (
      <Card style={styles.sectionCard}>
        <View style={styles.readyBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.mint} />
          <Text style={styles.readyLabel}>Lien prêt — expire dans 7 jours</Text>
        </View>
        <View style={styles.linkBox}>
          <Ionicons name="link-outline" size={14} color={Colors.textMuted} />
          <Text
            variant="caption"
            color="secondary"
            style={styles.linkText}
            numberOfLines={1}
            selectable
          >
            {link}
          </Text>
        </View>
        <Button
          label="Partager à nouveau"
          onPress={handleShare}
          variant="primary"
          fullWidth
          leftIcon={<Ionicons name="share-outline" size={16} color={Colors.textInverse} />}
          style={{ marginTop: Spacing.sm }}
        />
        <Button
          label="Générer un nouveau lien"
          onPress={() => { setLink(null); onDone(); }}
          variant="ghost"
          fullWidth
          style={{ marginTop: Spacing.xs }}
        />
      </Card>
    );
  }

  return (
    <Card style={styles.sectionCard}>
      <Text variant="body" color="secondary" style={styles.linkDesc}>
        Un lien unique et sécurisé sera créé. Partagez-le par SMS, WhatsApp ou tout autre canal.
      </Text>
      <Button
        label="Générer et partager le lien"
        onPress={handleGenerateAndShare}
        isLoading={createInvitation.isPending}
        variant="primary"
        fullWidth
        leftIcon={<Ionicons name="share-outline" size={16} color={Colors.textInverse} />}
        style={{ marginTop: Spacing.sm }}
      />
    </Card>
  );
}

// ─── Pending Invitations ──────────────────────────────────────────────────────

function PendingInvitationsSection({ householdId }: { householdId: string }) {
  const { data: invitations = [], isLoading } = usePendingInvitations(householdId);
  const { showToast } = useUiStore();
  const revokeInvitation = useRevokeInvitation();

  const handleRevoke = (id: string, label: string) => {
    Alert.alert(
      "Annuler l'invitation ?",
      `Annuler l'invitation envoyée à ${label} ?`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: "Annuler l'invitation",
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeInvitation.mutateAsync(id);
              showToast('Invitation annulée', 'success');
            } catch {
              showToast("Impossible d'annuler l'invitation", 'error');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.pendingSection}>
      <View style={styles.pendingHeader}>
        <Text variant="overline" color="muted">Invitations en attente</Text>
        {invitations.length > 0 && (
          <View style={styles.pendingCount}>
            <Text style={styles.pendingCountText}>{invitations.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginTop: Spacing.base }} />
      ) : invitations.length === 0 ? (
        <Text variant="bodySmall" color="muted" style={styles.noPending}>
          Aucune invitation en attente
        </Text>
      ) : (
        <Card>
          {invitations.map((inv, i) => (
            <View key={inv.id}>
              {i > 0 && <Divider />}
              <InvitationRow
                invitation={inv}
                onRevoke={() => handleRevoke(inv.id, inv.email ?? CHANNEL_LABEL[inv.channel] ?? 'cette personne')}
                isRevoking={revokeInvitation.isPending}
              />
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

function InvitationRow({
  invitation,
  onRevoke,
  isRevoking,
}: {
  invitation: Invitation;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const expiresAt = dayjs(invitation.expires_at);
  const daysLeft = expiresAt.diff(dayjs(), 'day');
  const isExpiringSoon = daysLeft <= 1;

  const expiryLabel = isExpiringSoon
    ? daysLeft === 0
      ? "Expire aujourd'hui"
      : 'Expire demain'
    : `Expire le ${expiresAt.format('D MMM')}`;

  const channelIcon = CHANNEL_ICON[invitation.channel] ?? 'link-outline';

  return (
    <View style={styles.invRow}>
      <View style={[styles.invIconWrap, { backgroundColor: Colors.blue + '15' }]}>
        <Ionicons name={channelIcon} size={14} color={Colors.blue} />
      </View>

      <View style={styles.invMeta}>
        <Text variant="label">
          {invitation.email ?? CHANNEL_LABEL[invitation.channel] ?? 'Invitation'}
        </Text>
        <Text
          variant="caption"
          style={{ color: isExpiringSoon ? Colors.coral : Colors.textMuted }}
        >
          {expiryLabel}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onRevoke}
        disabled={isRevoking}
        style={styles.revokeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isRevoking ? (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        ) : (
          <Ionicons name="close-circle-outline" size={22} color={Colors.textMuted} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },

  householdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    marginTop: -Spacing.xs,
  },

  guardCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  guardTitle: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  guardSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  actionRowActive: {
    // no visual change — chevron handles it
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },

  // Inline section cards
  sectionCard: {
    gap: Spacing.sm,
  },

  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.mint + '18',
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  readyLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.mint,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  linkText: {
    flex: 1,
  },
  linkDesc: {
    lineHeight: 22,
  },

  // Pending invitations
  pendingSection: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pendingCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pendingCountText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  noPending: {
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    color: Colors.textMuted,
  },

  // Invitation row
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  invIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invMeta: {
    flex: 1,
    gap: 2,
  },
  revokeBtn: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
