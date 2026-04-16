import React, { useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ListCard } from '../../../src/components/lists/ListCard';
import { useLists } from '../../../src/lib/queries/lists';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { SharedList } from '../../../src/types';

const ListSeparator = () => <View style={styles.separator} />;

export default function ListsScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const { data: lists = [], isLoading, isError, refetch, isRefetching } = useLists();

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleListPress = useCallback(
    (list: SharedList) => {
      router.push(`/(app)/lists/${list.id}`);
    },
    [router]
  );

  const handleCreate = useCallback(() => {
    router.push('/(app)/lists/create');
  }, [router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          variant="household"
          title="Rejoignez un foyer"
          subtitle="Vous devez faire partie d'un foyer pour gerer les listes."
          action={{ label: 'Configurer mon foyer', onPress: () => router.push('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement des listes..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          variant="generic"
          title="Erreur de chargement"
          subtitle="Impossible de charger les listes. Vérifiez votre connexion."
          action={{ label: 'Réessayer', onPress: () => refetch() }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Listes</Text>
        <Text variant="bodySmall" color="secondary">
          {lists.length} {lists.length === 1 ? 'liste' : 'listes'}
        </Text>
      </View>

      {/* List */}
      {lists.length === 0 ? (
        <EmptyState
          variant="lists"
          expression="normal"
          action={{ label: 'Creer une liste', onPress: handleCreate }}
        />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListCard
              list={item}
              onPress={() => handleListPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreate}
        style={styles.fab}
        activeOpacity={0.85}
        accessibilityLabel="Creer une liste"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    gap: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
    paddingTop: Spacing.sm,
  },
  separator: {
    height: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
