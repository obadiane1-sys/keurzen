import React from 'react';
import { Modal, View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { HouseholdMember } from '../../types';

interface NewConversationSheetProps {
  visible: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export function NewConversationSheet({
  visible,
  onClose,
  members,
  currentUserId,
  onSelect,
}: NewConversationSheetProps) {
  const others = members.filter((m) => m.user_id !== currentUserId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Title */}
        <Text variant="h4" weight="semibold" style={styles.title}>
          Nouveau message
        </Text>

        {others.length === 0 ? (
          <Text variant="body" color="muted" style={styles.empty}>
            Aucun autre membre dans votre foyer.
          </Text>
        ) : (
          <FlatList
            data={others}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberRow}
                onPress={() => {
                  onSelect(item.user_id);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text variant="body">
                  {item.profile?.full_name ?? 'Membre'}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['3xl'],
    minHeight: 200,
    maxHeight: '60%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.base,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  empty: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
});
