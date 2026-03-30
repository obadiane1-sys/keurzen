import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMyHousehold, useHouseholdMembers, useCreateHousehold, useJoinHousehold } from '../../../src/lib/queries/household';
import { useRecentCodes, useGenerateInviteCode } from '../../../src/lib/queries/invitation-codes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import type { InvitationCode } from '../../../src/types';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Loader } from '../../../src/components/ui/Loader';

export default function HouseholdScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();
  const { data: household, isLoading } = useMyHousehold();
  const { currentHousehold } = useHouseholdStore();
  const { data: members } = useHouseholdMembers(currentHousehold?.id);
  const { data: recentCodes } = useRecentCodes(currentHousehold?.id);
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const generateCode = useGenerateInviteCode();

  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Filter pending invitations (not used, not expired)
  const pendingInvites = (recentCodes ?? []).filter(
    (c) => !c.used && new Date(c.expires_at) > new Date(),
  );

  const handleResend = async (invite: InvitationCode) => {
    if (!invite.email) return;
    setResendingId(invite.id);
    try {
      await generateCode.mutateAsync({
        email: invite.email,
        firstName: invite.invited_name ?? undefined,
      });
      showToast('Invitation renvoyée !', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setResendingId(null);
    }
  };
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.navy} />
          </TouchableOpacity>
          <Text variant="h2" style={styles.title}>Mon foyer</Text>
        </View>

        {household ? (
          <>
            {/* Foyer info card */}
            <Card style={styles.householdCard}>
              <View style={styles.householdInfo}>
                <View style={styles.householdIcon}>
                  <Ionicons name="home" size={22} color={Colors.mint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{household.name}</Text>
                  <Text variant="caption" color="muted">
                    Code : {household.invite_code}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Members section */}
            <View style={styles.sectionHeader}>
              <Text variant="label" color="secondary">
                Membres ({members?.length ?? 0})
              </Text>
            </View>

            <Card style={styles.membersCard}>
              {members?.map((m, index) => (
                <View
                  key={m.id}
                  style={[
                    styles.memberRow,
                    index < (members.length - 1) && styles.memberRowBorder,
                  ]}
                >
                  <Avatar
                    name={m.profile?.full_name}
                    avatarUrl={m.profile?.avatar_url}
                    color={m.color}
                    size="md"
                  />
                  <View style={styles.memberInfo}>
                    <Text variant="body">{m.profile?.full_name ?? 'Membre'}</Text>
                    <Text variant="caption" color="muted">
                      {m.role === 'owner' ? 'Administrateur' : 'Membre'}
                    </Text>
                  </View>
                  {m.role === 'owner' && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
              ))}
            </Card>

            {/* Pending invitations */}
            {pendingInvites.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text variant="label" color="secondary">
                    Invitations en attente ({pendingInvites.length})
                  </Text>
                </View>

                <Card style={styles.membersCard}>
                  {pendingInvites.map((invite, index) => {
                    const daysLeft = Math.ceil(
                      (new Date(invite.expires_at).getTime() - Date.now()) / 86_400_000,
                    );
                    return (
                      <View
                        key={invite.id}
                        style={[
                          styles.memberRow,
                          index < pendingInvites.length - 1 && styles.memberRowBorder,
                        ]}
                      >
                        <View style={styles.pendingIconCircle}>
                          <Ionicons name="mail-outline" size={18} color={Colors.coral} />
                        </View>
                        <View style={styles.memberInfo}>
                          <Text variant="body">
                            {invite.invited_name ?? invite.email ?? 'Invité'}
                          </Text>
                          <Text variant="caption" color="muted">
                            {invite.email ? invite.email : ''}
                            {invite.email && daysLeft > 0 ? '  ·  ' : ''}
                            {daysLeft > 0
                              ? `Expire dans ${daysLeft}j`
                              : "Expire aujourd'hui"}
                          </Text>
                        </View>
                        {invite.email && (
                          <TouchableOpacity
                            style={styles.resendBtn}
                            onPress={() => handleResend(invite)}
                            disabled={resendingId === invite.id}
                            activeOpacity={0.7}
                          >
                            {resendingId === invite.id ? (
                              <Loader size="small" />
                            ) : (
                              <Ionicons name="refresh" size={16} color={Colors.mint} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </Card>
              </>
            )}

            {/* Invite CTA */}
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => router.push('/(app)/settings/invite')}
              activeOpacity={0.85}
            >
              <View style={styles.inviteBtnLeft}>
                <View style={styles.inviteIconCircle}>
                  <Ionicons name="person-add" size={18} color={Colors.mint} />
                </View>
                <Text variant="body" style={styles.inviteBtnText}>Inviter un membre</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
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
                  <Text variant="bodySmall" color="mint" style={{ textAlign: 'center' }}>
                    Annuler
                  </Text>
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
                  <Text variant="bodySmall" color="mint" style={{ textAlign: 'center' }}>
                    Annuler
                  </Text>
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
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: { flex: 1 },
  householdCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.base,
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  householdIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.mint + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  membersCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  memberRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  memberInfo: { flex: 1, gap: 2 },
  ownerBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.mint + '20',
  },
  ownerBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.greenStrong,
    fontWeight: '600',
  },
  pendingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.coral + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.mint + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  inviteBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  inviteIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.mint + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  noHousehold: { gap: Spacing.xl },
  actions: { gap: Spacing.base },
  formSection: { gap: Spacing.base },
});
