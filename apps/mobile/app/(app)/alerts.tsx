import React, { useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import {
  useAlerts,
  useMarkAlertAsRead,
  useMarkAllAlertsAsRead,
} from '@keurzen/queries';
import type { Alert, AlertLevel, AlertType } from '@keurzen/shared';

import { Colors, Spacing, BorderRadius, Shadows } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Loader } from '../../src/components/ui/Loader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';

const levelStyle: Record<AlertLevel, { color: string; bg: string; label: string }> = {
  balanced: { color: Colors.sauge, bg: `${Colors.sauge}1A`, label: 'Equilibre' },
  watch: { color: Colors.miel, bg: `${Colors.miel}1A`, label: 'Attention' },
  unbalanced: { color: Colors.rose, bg: `${Colors.rose}1A`, label: 'Desequilibre' },
};

const typeLabel: Record<AlertType, string> = {
  task_imbalance: 'Repartition des taches',
  time_imbalance: 'Temps investi',
  overload: 'Surcharge',
};

function formatWhen(iso: string): string {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return `Aujourd'hui ${d.format('HH:mm')}`;
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return `Hier ${d.format('HH:mm')}`;
  return d.format('DD MMM YYYY');
}

export default function AlertsScreen() {
  const { data: alerts = [], isLoading, isRefetching, refetch } = useAlerts();
  const { mutate: markOne } = useMarkAlertAsRead();
  const { mutate: markAll, isPending: markAllPending } = useMarkAllAlertsAsRead();

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts],
  );

  const handleMarkAll = () => {
    const run = () => markAll();
    if (Platform.OS === 'web') {
      if (window.confirm('Tout marquer comme lu ?')) run();
      return;
    }
    RNAlert.alert('Tout marquer comme lu', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: run },
    ]);
  };

  const headerRight =
    unreadCount === 0 ? null : (
      <TouchableOpacity
        onPress={handleMarkAll}
        disabled={markAllPending}
        hitSlop={8}
      >
        <Text variant="bodySmall" weight="bold" style={styles.markAll}>
          Tout lire
        </Text>
      </TouchableOpacity>
    );

  if (isLoading) return <Loader fullScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Alertes"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'A jour'}
        rightAction={headerRight}
      />

      {alerts.length === 0 ? (
        <EmptyState
          expression="happy"
          title="Aucune alerte"
          subtitle="Tout va bien dans votre foyer. Continuez comme ca !"
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.terracotta}
              colors={[Colors.terracotta]}
            />
          }
          renderItem={({ item }) => (
            <AlertRow alert={item} onPress={() => !item.read && markOne(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function AlertRow({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const level = levelStyle[alert.level];
  const iconName: Record<AlertType, keyof typeof Ionicons.glyphMap> = {
    task_imbalance: 'swap-horizontal-outline',
    time_imbalance: 'time-outline',
    overload: 'alert-circle-outline',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        !alert.read && styles.rowUnread,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: level.bg }]}>
        <Ionicons
          name={iconName[alert.type] ?? 'alert-circle-outline'}
          size={20}
          color={level.color}
        />
      </View>
      <View style={styles.rowMain}>
        <View style={styles.rowHeader}>
          <Text variant="bodySmall" weight="bold">
            {typeLabel[alert.type]}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: level.bg }]}>
            <Text
              variant="caption"
              weight="bold"
              style={{ color: level.color, fontSize: 10 }}
            >
              {level.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text variant="bodySmall" color="secondary" style={styles.message}>
          {alert.message}
        </Text>
        <Text variant="caption" color="muted" style={styles.when}>
          {formatWhen(alert.created_at)}
        </Text>
      </View>
      {!alert.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  markAll: {
    color: Colors.terracotta,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  separator: {
    height: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  rowUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.terracotta,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  message: {
    lineHeight: 18,
    marginBottom: 4,
  },
  when: {
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.terracotta,
    marginTop: Spacing.md,
  },
});
