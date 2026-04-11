import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
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
      contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
      className="mb-8"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={`flex-row items-center px-6 py-3 rounded-full border-2 shadow-soft ${
              isActive
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-surface'
            }`}
            activeOpacity={0.7}
          >
            <View
              className={`w-6 h-6 items-center justify-center rounded-2xl ${
                isActive ? 'bg-primary/20' : 'bg-gray-100'
              }`}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={14}
                color={isActive ? '#00E5FF' : '#718096'}
              />
            </View>
            <Text
              className={`ml-2 text-sm font-bold ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`}
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
