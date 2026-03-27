import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useCreateHousehold, useHouseholdMembers } from '../../../src/lib/queries/household';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Divider } from '../../../src/components/ui/Divider';
import { Ionicons } from '@expo/vector-icons';

export default function HouseholdScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();
  const { currentHousehold } = useHouseholdStore();
  const { data: members = [] } = useHouseholdMembers(currentHousehold?.id);
  const createHousehold = useCreateHousehold();

  const [householdName, setHouseholdName] = useState('');
  const [mode, setMode] = useState<'menu' | 'create'>('menu');

  const handleCreate = async () => {
    if (!householdName.trim()) {
      showToast('Entrez un nom de foyer', 'error');
      return;
    }
    try {
      await createHousehold.mutateAsync(householdName.trim());
      showToast('Foyer créé !', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Mon foyer</Text>
          <View style={{ width: 44 }} />
        </View>

        {currentHousehold ? (
          <>
            {/* Household info */}
            <Card>
              <View style={styles.householdHeader}>
                <View style={[styles.householdIcon, { backgroundColor: Colors.mint + '25' }]}>
                  <Ionicons name="home" size={24} color={Colors.mint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="h4">{currentHousehold.name}</Text>
                </View>
              </View>

              <Button
                label="Inviter un membre"
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Ionicons name="person-add-outline" size={16} color={Colors.navy} />}
                onPress={() => router.push('/(app)/settings/invite')}
                style={{ marginTop: Spacing.base }}
              />
            </Card>

            {/* Members list */}
            <Card>
              <Text variant="h4" style={{ marginBottom: Spacing.base }}>
                Membres ({members.length})
              </Text>
              {members.map((member, index) => (
                <View key={member.id}>
                  {index > 0 && <Divider />}
                  <View style={styles.memberRow}>
                    <Avatar
                      name={member.profile?.full_name}
                      avatarUrl={member.profile?.avatar_url}
                      color={member.color}
                      size="md"
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="label">{member.profile?.full_name ?? 'Membre'}</Text>
                      <Text variant="caption" color="muted">{member.profile?.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: member.color + '25' }]}>
                      <Text variant="caption" style={{ color: member.color, fontWeight: '600' }}>
                        {member.role === 'owner' ? 'Admin' : 'Membre'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <>
            {/* No household — create or join */}
            {mode === 'menu' && (
              <View style={styles.setupOptions}>
                <Text variant="h4" style={styles.setupTitle}>
                  Commencez par créer un foyer
                </Text>
                <Button
                  label="Créer un foyer"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => setMode('create')}
                />
              </View>
            )}

            {mode === 'create' && (
              <Card>
                <Text variant="h4" style={{ marginBottom: Spacing.base }}>Créer un foyer</Text>
                <Input
                  label="Nom du foyer"
                  placeholder="Famille Dupont"
                  value={householdName}
                  onChangeText={setHouseholdName}
                  leftIcon="home-outline"
                />
                <View style={styles.btnRow}>
                  <Button label="Annuler" variant="ghost" onPress={() => setMode('menu')} style={{ flex: 1 }} />
                  <Button
                    label="Créer"
                    variant="primary"
                    isLoading={createHousehold.isPending}
                    onPress={handleCreate}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            )}

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  householdHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  householdIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, paddingVertical: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  setupOptions: { gap: Spacing.base, paddingTop: Spacing.xl },
  setupTitle: { textAlign: 'center', marginBottom: Spacing.sm },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.base },
});
