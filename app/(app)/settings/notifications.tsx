import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase/client';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Divider } from '../../../src/components/ui/Divider';
import { Ionicons } from '@expo/vector-icons';

interface NotifPrefs {
  morning_digest: boolean;
  task_reminder: boolean;
  overdue_alert: boolean;
  imbalance_alert: boolean;
  digest_hour: number;
}

const DEFAULT_PREFS: NotifPrefs = {
  morning_digest: true,
  task_reminder: true,
  overdue_alert: true,
  imbalance_alert: true,
  digest_hour: 8,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useUiStore();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          morning_digest: data.morning_digest,
          task_reminder: data.task_reminder,
          overdue_alert: data.overdue_alert,
          imbalance_alert: data.imbalance_alert,
          digest_hour: data.digest_hour,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const updatePref = async (key: keyof NotifPrefs, value: boolean | number) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    await supabase
      .from('notification_preferences')
      .upsert({ user_id: user!.id, ...updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Notifications</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
          {[
            { key: 'morning_digest' as const, label: 'Digest du matin', desc: 'Résumé des tâches du jour', icon: 'sunny-outline' as const },
            { key: 'task_reminder' as const, label: 'Rappels de tâches', desc: '30 min avant l\'échéance', icon: 'alarm-outline' as const },
            { key: 'overdue_alert' as const, label: 'Alertes en retard', desc: 'Quand une tâche passe en retard', icon: 'alert-circle-outline' as const },
            { key: 'imbalance_alert' as const, label: 'Alertes de déséquilibre', desc: 'Si la charge devient inégale', icon: 'scale-outline' as const },
          ].map((item, i) => (
            <View key={item.key}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <Ionicons name={item.icon} size={20} color={Colors.textSecondary} style={{ width: 28 }} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{item.label}</Text>
                  <Text variant="caption" color="muted">{item.desc}</Text>
                </View>
                <Switch
                  value={prefs[item.key] as boolean}
                  onValueChange={(v) => updatePref(item.key, v)}
                  trackColor={{ false: Colors.gray200, true: Colors.mint }}
                  thumbColor={Colors.backgroundCard}
                />
              </View>
            </View>
          ))}
        </Card>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 60,
  },
});
