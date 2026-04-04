import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { IconAlert, IconBrain, IconBell, IconChevronRight } from './Icons';
import { DCOLORS, DFONT } from './constants';

export interface AlertItem {
  type: 'overdue' | 'imbalance' | 'reminder';
  message: string;
}

interface AlertCardProps {
  alerts: AlertItem[];
  onPressAlert?: (alert: AlertItem) => void;
}

const iconMap = {
  overdue: (props: { size: number; color: string }) => <IconAlert {...props} />,
  imbalance: (props: { size: number; color: string }) => <IconBrain {...props} />,
  reminder: (props: { size: number; color: string }) => <IconBell {...props} />,
};

const colorMap = {
  overdue: { icon: DCOLORS.coral, bg: DCOLORS.coralLight, border: DCOLORS.coral + '40' },
  imbalance: { icon: DCOLORS.lavender, bg: DCOLORS.lavenderLight, border: DCOLORS.lavender + '40' },
  reminder: { icon: DCOLORS.blue, bg: DCOLORS.blueLight, border: DCOLORS.blue + '40' },
};

export function AlertCard({ alerts, onPressAlert }: AlertCardProps) {
  if (!alerts.length) return null;

  return (
    <View style={styles.container}>
      {alerts.map((alert, i) => {
        const colors = colorMap[alert.type];
        const Icon = iconMap[alert.type];

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.alertRow,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => onPressAlert?.(alert)}
          >
            <Icon size={18} color={colors.icon} />
            <View style={styles.messageContainer}>
              <Text
                variant="body"
                weight="medium"
                style={{ color: DCOLORS.navy, fontSize: DFONT.body.size }}
              >
                {alert.message}
              </Text>
            </View>
            <IconChevronRight size={16} color={DCOLORS.textMuted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  messageContainer: {
    flex: 1,
  },
});
