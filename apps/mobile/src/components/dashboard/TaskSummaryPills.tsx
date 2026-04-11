import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../ui/Text';

interface TaskSummaryPillsProps {
  todoCount: number;
  overdueCount: number;
  completedCount: number;
}

export function TaskSummaryPills({ todoCount, overdueCount, completedCount }: TaskSummaryPillsProps) {
  const pills = [
    { label: `${todoCount} a faire`, bgClassName: 'bg-primary/10', textColor: '#00E5FF' },
    { label: `${overdueCount} en retard`, bgClassName: 'bg-danger/10', textColor: '#FF6B6B' },
    { label: `${completedCount} completees`, bgClassName: 'bg-success/10', textColor: '#48BB78' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
    >
      {pills.map((pill) => (
        <View key={pill.label} className={`px-4 py-2 rounded-full ${pill.bgClassName}`}>
          <Text
            style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: pill.textColor }}
          >
            {pill.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
