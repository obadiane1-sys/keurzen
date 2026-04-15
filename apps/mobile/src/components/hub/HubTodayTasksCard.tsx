import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { useTasks, useTodayTasks } from '@keurzen/queries';

export function HubTodayTasksCard() {
  const router = useRouter();
  const tasksQ = useTasks();
  const today = useTodayTasks();

  const isLoading = !!tasksQ.isLoading;
  const visible = today.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>Aujourd'hui</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonGroup}>
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
        </View>
      ) : visible.length === 0 ? (
        <Text style={styles.empty}>Journée libre ✨</Text>
      ) : (
        <View style={styles.list}>
          {visible.map((task, idx) => (
            <View key={task.id} style={styles.row}>
              <Text style={styles.index}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {task.title}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir toutes les tâches"
        onPress={() => router.push('/(app)/tasks' as never)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>VOIR TOUTES LES TÂCHES</Text>
        <Ionicons name="arrow-forward" size={14} color="#967BB6" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F8FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCD7E8',
    padding: 24,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#967BB6' },
  title: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#967BB6' },
  list: { gap: 14, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  index: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: '#967BB6',
    width: 22,
  },
  rowTitle: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#5F5475',
  },
  empty: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: 'rgba(95,84,117,0.6)',
    textAlign: 'center',
    marginVertical: 24,
  },
  skeletonGroup: { gap: 12, marginTop: 16 },
  skeletonRow: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    minHeight: 44,
    paddingVertical: 12,
  },
  footerText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: '#967BB6',
  },
});
