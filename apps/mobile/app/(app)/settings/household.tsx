import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import {
  useMyHousehold,
  useHouseholdMembers,
  useCreateHousehold,
  useJoinHousehold,
} from '../../../src/lib/queries/household';
import {
  useRecentCodes,
  useDeleteInviteCode,
} from '../../../src/lib/queries/invitation-codes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import type { InvitationCode } from '../../../src/types';
import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Loader } from '../../../src/components/ui/Loader';

dayjs.locale('fr');

export default function HouseholdScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();
  const { data: household, isLoading } = useMyHousehold();
  const { currentHousehold } = useHouseholdStore();
  const { data: members } = useHouseholdMembers(currentHousehold?.id);
  const { data: recentCodes } = useRecentCodes(currentHousehold?.id);
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const deleteCode = useDeleteInviteCode();

  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const pendingInvites = (recentCodes ?? []).filter(
    (c) => !c.used && new Date(c.expires_at) > new Date(),
  );

  const handleDeleteInvite = (invite: InvitationCode) => {
    const label = invite.invited_name ?? invite.email ?? 'cet invité';
    const doDelete = async () => {
      try {
        await deleteCode.mutateAsync(invite.id);
        showToast('Invitation supprimée', 'success');
      } catch (e) {
        showToast((e as Error).message, 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer l'invitation pour ${label} ?`)) doDelete();
    } else {
      Alert.alert('Supprimer l\'invitation', `Supprimer l'invitation pour ${label} ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createHousehold.mutateAsync(name.trim());
      showToast('Foyer créé !', 'success');
      setMode('none');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    try {
      await joinHousehold.mutateAsync(code.trim());
      showToast('Vous avez rejoint le foyer !', 'success');
      setMode('none');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  if (isLoading) return <Loader fullScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Foyer</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {household ? (
          <>
            {/* Foyer hero */}
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{household.name}</Text>
                <Text style={styles.heroSubtitle}>
                  {(members?.length ?? 0)} membre{(members?.length ?? 0) > 1 ? 's' : ''}
                  {household.created_at
                    ? ` · Créé en ${dayjs(household.created_at).format('MMMM YYYY')}`
                    : ''}
                </Text>
              </View>
            </View>

            {/* Members */}
            <Text style={styles.sectionLabel}>
              Membres ({members?.length ?? 0})
            </Text>

            <View style={styles.list}>
              {members?.map((m) => {
                const isOwner = m.role === 'owner';
                return (
                  <View key={m.id} style={styles.row}>
                    <Avatar
                      name={m.profile?.full_name}
                      avatarUrl={m.profile?.avatar_url}
                      color={m.color}
                      size="md"
                    />
                    <View style={styles.rowBody}>
                      <View style={styles.rowTitleLine}>
                        <Text style={styles.rowName}>
                          {m.profile?.full_name ?? 'Membre'}
                        </Text>
                        <View
                          style={[
                            styles.badge,
                            isOwner ? styles.badgeOwner : styles.badgeMember,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isOwner ? styles.badgeTextOwner : styles.badgeTextMember,
                            ]}
                          >
                            {isOwner ? 'Admin' : 'Membre'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.rowCaption} numberOfLines={1}>
                        {m.profile?.email ?? ' '}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.gray300}
                    />
                  </View>
                );
              })}
            </View>

            {/* Invite CTA */}
            <TouchableOpacity
              style={styles.inviteLink}
              onPress={() => router.push('/(app)/settings/invite')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Inviter un membre"
            >
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.inviteLinkText}>Inviter un membre</Text>
            </TouchableOpacity>

            {/* Pending invitations */}
            {pendingInvites.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
                  Invitations en cours
                </Text>

                <View style={styles.list}>
                  {pendingInvites.map((invite, index) => {
                    const last = index === pendingInvites.length - 1;
                    const label = invite.invited_name ?? invite.email ?? 'Invité';
                    return (
                      <View
                        key={invite.id}
                        style={[
                          styles.inviteRow,
                          !last && styles.inviteRowBorder,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inviteName}>{label}</Text>
                          {invite.email && (
                            <Text style={styles.inviteEmail} numberOfLines={1}>
                              {invite.email}
                            </Text>
                          )}
                        </View>
                        <View style={styles.statusWrap}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>EN ATTENTE</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.closeBtn}
                          onPress={() => handleDeleteInvite(invite)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Supprimer l'invitation pour ${label}`}
                        >
                          <Ionicons name="close" size={14} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.noHousehold}>
            {mode === 'none' && (
              <View style={styles.actions}>
                <Button
                  label="Créer un foyer"
                  onPress={() => setMode('create')}
                  fullWidth
                  size="lg"
                />
                <Button
                  label="Rejoindre avec un code"
                  variant="outline"
                  onPress={() => setMode('join')}
                  fullWidth
                  size="lg"
                />
              </View>
            )}

            {mode === 'create' && (
              <View style={styles.formSection}>
                <Input
                  label="Nom du foyer"
                  placeholder="Ex: Famille Dupont"
                  value={name}
                  onChangeText={setName}
                  leftIcon="home-outline"
                />
                <Button
                  label="Créer"
                  onPress={handleCreate}
                  isLoading={createHousehold.isPending}
                  fullWidth
                  size="lg"
                />
                <TouchableOpacity onPress={() => setMode('none')}>
                  <Text style={styles.cancelLink}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'join' && (
              <View style={styles.formSection}>
                <Input
                  label="Code d'invitation"
                  placeholder="Entrez le code"
                  value={code}
                  onChangeText={setCode}
                  leftIcon="key-outline"
                  autoCapitalize="none"
                />
                <Button
                  label="Rejoindre"
                  onPress={handleJoin}
                  isLoading={joinHousehold.isPending}
                  fullWidth
                  size="lg"
                />
                <TouchableOpacity onPress={() => setMode('none')}>
                  <Text style={styles.cancelLink}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // ─── Header ─────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    height: 56,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },

  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },

  // ─── Hero ─────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  heroTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },

  // ─── Section label ─────────────────
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },
  sectionLabelSpaced: {
    marginTop: Spacing.lg,
  },

  // ─── Member list ─────────────────
  list: {
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  rowCaption: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeOwner: {
    borderColor: Colors.primary + '4D',
    backgroundColor: 'transparent',
  },
  badgeMember: {
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semibold,
  },
  badgeTextOwner: { color: Colors.primary },
  badgeTextMember: { color: Colors.textMuted },

  // ─── Invite link ─────────────────
  inviteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.base,
    marginTop: Spacing.sm,
  },
  inviteLinkText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },

  // ─── Pending invitations ─────────
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.md,
  },
  inviteRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  inviteName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  inviteEmail: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── No household ─────────────────
  noHousehold: { gap: Spacing.xl, paddingTop: Spacing.lg },
  actions: { gap: Spacing.base },
  formSection: { gap: Spacing.base },
  cancelLink: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },
});
