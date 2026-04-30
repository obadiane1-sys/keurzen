import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Mascot } from '../ui/Mascot';
import {
  useMyPendingInvitations,
  useRedeemInviteCode,
  type PendingInvitation,
} from '../../lib/queries/invitation-codes';
import { useUiStore } from '../../stores/ui.store';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/tokens';

export function InvitationBanner() {
  const { data: invitations, isLoading } = useMyPendingInvitations();

  if (isLoading || !invitations || invitations.length === 0) return null;

  return (
    <View style={styles.container}>
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.code} invitation={invitation} />
      ))}
    </View>
  );
}

function InvitationCard({ invitation }: { invitation: PendingInvitation }) {
  const redeem = useRedeemInviteCode();
  const showToast = useUiStore((s) => s.showToast);

  const handleAccept = async () => {
    if (redeem.isPending) return;
    try {
      const result = await redeem.mutateAsync(invitation.code);
      if (result.already_member) {
        showToast(`Vous faites déjà partie de ${invitation.household_name}`, 'info');
      } else {
        showToast(`Bienvenue dans ${invitation.household_name} !`, 'success');
      }
    } catch (err) {
      showToast((err as Error).message ?? "Impossible de rejoindre le foyer", 'error');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.mascotWrap}>
          <Mascot size={56} expression="happy" />
        </View>

        <View style={styles.body}>
          <View style={styles.pill}>
            <Ionicons name="mail-unread-outline" size={12} color={Colors.primary} />
            <Text style={styles.pillText}>Invitation</Text>
          </View>
          <Text style={styles.title}>
            <Text style={styles.titleStrong}>{invitation.inviter_name}</Text>
            {' vous invite à rejoindre '}
            <Text style={styles.titleStrong}>{invitation.household_name}</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleAccept}
        disabled={redeem.isPending}
        activeOpacity={0.85}
        style={[styles.cta, redeem.isPending && styles.ctaDisabled]}
      >
        {redeem.isPending ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <>
            <Text style={styles.ctaLabel}>Rejoindre le foyer</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    padding: Spacing.lg,
    gap: Spacing.base,
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  mascotWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '14',
  },
  pillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  titleStrong: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
});
