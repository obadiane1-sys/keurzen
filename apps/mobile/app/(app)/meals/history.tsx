import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useMealHistory } from '../../../src/lib/queries/meals';
import type { MealPlanItem, MealType } from '../../../src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  return `Semaine du ${start.getDate()} ${MONTHS_FR[start.getMonth()]}`;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAYS_FR[d.getDay()];
  return `${dayName.charAt(0).toUpperCase()}${dayName.slice(1)} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

interface WeekGroup {
  weekStart: string;
  items: MealPlanItem[];
}

function groupByWeek(items: MealPlanItem[]): WeekGroup[] {
  const map = new Map<string, MealPlanItem[]>();
  for (const item of items) {
    const ws = getWeekStart(item.date);
    if (!map.has(ws)) map.set(ws, []);
    map.get(ws)!.push(item);
  }
  // Sort weeks descending (most recent first)
  const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  return sorted.map(([weekStart, wItems]) => ({
    weekStart,
    items: [...wItems].sort((a, b) => b.date.localeCompare(a.date) || a.meal_type.localeCompare(b.meal_type)),
  }));
}

// ─── History Item ─────────────────────────────────────────────────────────────

interface HistoryItemProps {
  item: MealPlanItem;
  onPress: () => void;
}

function HistoryItem({ item, onPress }: HistoryItemProps) {
  const mealLabel = MEAL_TYPE_LABELS[item.meal_type];

  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.itemLeft}>
        <View style={styles.mealTypeDot} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.recipe?.title ?? 'Recette inconnue'}
          </Text>
          <Text style={styles.itemMeta}>
            {formatDayLabel(item.date)} · {mealLabel}
          </Text>
          {item.assigned_profile && (
            <Text style={styles.itemCook}>
              Cuisiné par {item.assigned_profile.full_name}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealHistoryScreen() {
  const router = useRouter();
  const { data: history = [], isLoading } = useMealHistory(3);

  const groups = useMemo(() => groupByWeek(history), [history]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des repas</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <Loader />
      ) : groups.length === 0 ? (
        <EmptyState
          variant="generic"
          title="Aucun repas planifié"
          subtitle="Vos repas passés apparaîtront ici au fil du temps."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <View key={group.weekStart} style={styles.weekGroup}>
              <Text style={styles.weekLabel}>{formatWeekLabel(group.weekStart)}</Text>
              {group.items.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onPress={() => {
                    if (item.recipe_id) {
                      router.push(`/(app)/meals/recipes/${item.recipe_id}`);
                    }
                  }}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  weekGroup: {
    marginBottom: Spacing.xl,
  },
  weekLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  mealTypeDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemCook: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
