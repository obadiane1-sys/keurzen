import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

interface Member {
  userId: string;
  name: string;
  color: string;
}

interface MemberFiltersProps {
  members: Member[];
  selectedMemberId: string | null; // null = "Tous"
  onMemberChange: (memberId: string | null) => void;
  onSortPress?: () => void;
}

export function MemberFilters({ members, selectedMemberId, onMemberChange, onSortPress }: MemberFiltersProps) {
  const isAllActive = selectedMemberId === null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {/* "Tous" chip */}
        <TouchableOpacity
          onPress={() => onMemberChange(null)}
          style={[styles.chip, isAllActive && styles.chipActive]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: isAllActive }}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={isAllActive ? styles.chipTextActive : styles.chipText}
          >
            Tous
          </Text>
        </TouchableOpacity>

        {/* Member chips */}
        {members.map((member) => {
          const active = selectedMemberId === member.userId;
          return (
            <TouchableOpacity
              key={member.userId}
              onPress={() => onMemberChange(member.userId)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                variant="caption"
                weight="semibold"
                style={active ? styles.chipTextActive : styles.chipText}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort button */}
      {onSortPress && (
        <TouchableOpacity
          onPress={onSortPress}
          style={styles.sortButton}
          activeOpacity={0.8}
          accessibilityLabel="Trier"
        >
          <Ionicons name="swap-vertical-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  chipTextActive: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
