import React from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type DashboardTabKey = 'insights' | 'stats' | 'tasks';

const TABS: { key: DashboardTabKey; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }[] = [
  { key: 'insights', icon: 'lightbulb-outline', label: 'Insights & Actions' },
  { key: 'stats', icon: 'chart-bar', label: 'My Stats' },
  { key: 'tasks', icon: 'clipboard-check-outline', label: 'Tasks' },
];

interface DashboardTabsProps {
  activeTab: DashboardTabKey;
  onTabChange: (tab: DashboardTabKey) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollContainer}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            style={[
              styles.tab,
              isActive ? styles.tabActive : styles.tabInactive,
            ]}
          >
            <View style={[styles.iconCircle, isActive ? styles.iconCircleActive : styles.iconCircleInactive]}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={14}
                color={isActive ? '#00E5FF' : '#718096'}
              />
            </View>
            <Text
              style={[styles.tabLabel, { color: isActive ? '#00E5FF' : '#718096' }]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    marginBottom: 32,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  tabInactive: {
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconCircleActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  iconCircleInactive: {
    backgroundColor: '#F7FAFC',
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
});
