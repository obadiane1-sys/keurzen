import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { ListItemRow } from '../../../src/components/lists/ListItemRow';
import { AddItemInput } from '../../../src/components/lists/AddItemInput';
import { ShoppingCategorySection } from '../../../src/components/lists/ShoppingCategorySection';
import { typeLabels } from '../../../src/components/lists/ListCard';
import {
  useListById,
  useListItems,
  useAddListItem,
  useToggleListItem,
  useDeleteListItem,
  useUpdateListItem,
  useUpdateList,
  useDeleteList,
} from '../../../src/lib/queries/lists';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { SharedListItem, SharedListItemFormValues, ShoppingItemCategory } from '../../../src/types';

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { members } = useHouseholdStore();

  // Queries
  const { data: list, isLoading: listLoading, error: listError } = useListById(id ?? '');
  const { data: items = [], isLoading: itemsLoading } = useListItems(id ?? '');

  // Mutations
  const addItem = useAddListItem();
  const toggleItem = useToggleListItem();
  const deleteItem = useDeleteListItem();
  const updateItem = useUpdateListItem();
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  // Local state
  const [showChecked, setShowChecked] = useState(false);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const uncheckedItems = useMemo(
    () => items.filter((i) => !i.checked),
    [items]
  );
  const checkedItems = useMemo(
    () => items.filter((i) => i.checked),
    [items]
  );
  const checkedCount = checkedItems.length;
  const totalCount = items.length;

  const typeConfig = list ? typeLabels[list.type] : null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAddItem = useCallback(
    (values: SharedListItemFormValues) => {
      if (!id) return;
      addItem.mutate({ listId: id, values });
    },
    [id, addItem]
  );

  const handleToggle = useCallback(
    (item: SharedListItem) => {
      if (!id) return;
      toggleItem.mutate({
        itemId: item.id,
        listId: id,
        checked: !item.checked,
      });
    },
    [id, toggleItem]
  );

  const confirmDelete = useCallback(
    (item: SharedListItem) => {
      if (!id) return;
      const doDelete = () => {
        deleteItem.mutate({ itemId: item.id, listId: id });
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Supprimer "${item.title}" ?`)) doDelete();
      } else {
        Alert.alert('Supprimer', `Supprimer "${item.title}" ?`, [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete },
        ]);
      }
    },
    [id, deleteItem]
  );

  const openAssignModal = useCallback(
    (item: SharedListItem) => {
      if (!id) return;
      if (members.length === 0) return;

      const options = members.map((m) => ({
        text: m.profile?.full_name ?? 'Membre',
        onPress: () =>
          updateItem.mutate({
            itemId: item.id,
            listId: id,
            data: { assigned_to: m.user_id },
          }),
      }));

      options.push({
        text: 'Retirer l\'assignation',
        onPress: () =>
          updateItem.mutate({
            itemId: item.id,
            listId: id,
            data: { assigned_to: null },
          }),
      });

      if (Platform.OS === 'web') {
        // Simple prompt on web
        const memberNames = members.map((m) => m.profile?.full_name ?? 'Membre');
        const choice = window.prompt(
          `Assigner "${item.title}" a :\n${memberNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\nEntrez le numero (ou vide pour retirer) :`
        );
        if (choice === null) return;
        const index = parseInt(choice, 10) - 1;
        if (index >= 0 && index < members.length) {
          updateItem.mutate({
            itemId: item.id,
            listId: id,
            data: { assigned_to: members[index].user_id },
          });
        } else if (choice.trim() === '') {
          updateItem.mutate({
            itemId: item.id,
            listId: id,
            data: { assigned_to: null },
          });
        }
      } else {
        Alert.alert(
          `Assigner "${item.title}"`,
          'Choisissez un membre',
          [
            ...options,
            { text: 'Annuler', style: 'cancel', onPress: () => {} },
          ]
        );
      }
    },
    [id, members, updateItem]
  );

  const handleMenuPress = useCallback(() => {
    if (!list) return;

    const handleArchive = () => {
      updateList.mutate(
        { id: list.id, updates: { archived: true } },
        { onSuccess: () => router.back() }
      );
    };

    const handleDelete = () => {
      deleteList.mutate(list.id, {
        onSuccess: () => router.back(),
      });
    };

    if (Platform.OS === 'web') {
      const choice = window.confirm('Supprimer cette liste ?');
      if (choice) handleDelete();
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Archiver', onPress: handleArchive },
        { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
        { text: 'Annuler', style: 'cancel' },
      ]);
    }
  }, [list, updateList, deleteList, router]);

  // ─── Render item ──────────────────────────────────────────────────────────

  const renderItem = useCallback(
    (item: SharedListItem) => (
      <ListItemRow
        item={item}
        onToggle={() => handleToggle(item)}
        onDelete={() => confirmDelete(item)}
        onLongPress={() => openAssignModal(item)}
      />
    ),
    [handleToggle, confirmDelete, openAssignModal]
  );

  // ─── Shopping grouped view ────────────────────────────────────────────────

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, SharedListItem[]> = {};
    for (const item of uncheckedItems) {
      const cat = item.category ?? 'autre';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    // Sort categories: known first, then 'autre'
    const knownOrder: ShoppingItemCategory[] = [
      'fruits_legumes',
      'viandes_poissons',
      'produits_laitiers',
      'boulangerie',
      'epicerie',
      'surgeles',
      'boissons',
      'hygiene',
      'entretien',
      'autre',
    ];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ia = knownOrder.indexOf(a);
      const ib = knownOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    return sortedKeys.map((cat) => ({ category: cat, items: groups[cat] }));
  }, [uncheckedItems]);

  const checkedFooter = useMemo(() => {
    if (!showChecked || checkedItems.length === 0) return null;
    return (
      <View style={styles.checkedSection}>
        <View style={styles.checkedDivider}>
          <View style={styles.dividerLine} />
          <Text variant="bodySmall" color="muted" style={styles.checkedLabel}>
            Cochés ({checkedCount})
          </Text>
          <View style={styles.dividerLine} />
        </View>
        {checkedItems.map((item) => (
          <View key={item.id}>{renderItem(item)}</View>
        ))}
      </View>
    );
  }, [showChecked, checkedItems, checkedCount, renderItem]);

  const emptyItems = useMemo(() => (
    <View style={styles.emptyState}>
      <Ionicons
        name={(typeConfig?.defaultIcon ?? 'list-outline') as keyof typeof Ionicons.glyphMap}
        size={40}
        color={Colors.textMuted}
      />
      <Text variant="body" color="muted" style={styles.emptyText}>
        Aucun élément pour le moment
      </Text>
    </View>
  ), [typeConfig]);

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (listLoading || itemsLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  if (listError || !list) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text variant="body" color="muted">
            Impossible de charger la liste.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text variant="body" color="primary" weight="semibold">
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            variant="body"
            weight="bold"
            color="primary"
            numberOfLines={1}
            style={styles.headerTitle}
          >
            {list.title}
          </Text>
          <View style={styles.headerSubtitleRow}>
            {typeConfig && (
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '33' }]}>
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
              </View>
            )}
            <Text variant="bodySmall" color="muted">
              {checkedCount}/{totalCount} complétés
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleMenuPress}
          style={styles.menuButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Menu"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Toggle show checked */}
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setShowChecked((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showChecked ? 'checkbox' : 'square-outline'}
          size={20}
          color={showChecked ? Colors.success : Colors.textMuted}
        />
        <Text variant="bodySmall" color="secondary">
          Afficher les éléments cochés
        </Text>
      </TouchableOpacity>

      {/* Items */}
      <View style={styles.listContainer}>
        {list.type === 'shopping' ? (
          // Shopping: grouped by category
          <FlatList
            data={groupedByCategory}
            keyExtractor={(group) => group.category}
            renderItem={({ item: group }) => (
              <ShoppingCategorySection
                category={group.category}
                items={group.items}
                renderItem={renderItem}
              />
            )}
            ListFooterComponent={checkedFooter}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyItems}
          />
        ) : (
          // Todo / Custom: flat list
          <FlatList
            data={uncheckedItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderItem(item)}
            ListFooterComponent={checkedFooter}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyItems}
          />
        )}
      </View>

      {/* Add item input — fixed at bottom */}
      <AddItemInput
        listType={list.type}
        onAdd={handleAddItem}
        isLoading={addItem.isPending}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  headerCenter: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.backgroundCard,
    minHeight: 44,
  },

  // List container
  listContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: Spacing.xl,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },

  // Checked section
  checkedSection: {
    marginTop: Spacing.md,
  },
  checkedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  checkedLabel: {
    flexShrink: 0,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
