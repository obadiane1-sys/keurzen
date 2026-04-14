import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import type { StatsScope, StatsPeriod } from '@keurzen/queries';

interface Props {
  scope: StatsScope;
  period: StatsPeriod;
  onScopeChange: (s: StatsScope) => void;
  onPeriodChange: (p: StatsPeriod) => void;
}

export function StatsHeader({ scope, period, onScopeChange, onPeriodChange }: Props) {
  return (
    <View className="px-6 pt-4">
      <View className="flex-row bg-[#F3F0FF] rounded-xl p-1 mb-6">
        {(['me', 'household'] as const).map((s) => {
          const active = scope === s;
          return (
            <Pressable
              key={s}
              onPress={() => onScopeChange(s)}
              className={`flex-1 py-3 rounded-lg ${active ? 'bg-white' : ''}`}
              style={
                active
                  ? {
                      shadowColor: '#967BB6',
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : undefined
              }
              accessibilityRole="button"
              accessibilityLabel={s === 'me' ? 'Stats personnelles' : 'Stats du foyer'}
            >
              <Text
                className="text-center uppercase"
                style={{
                  fontFamily: 'Nunito_700Bold',
                  fontSize: 11,
                  color: active ? '#5F5475' : 'rgba(95,84,117,0.6)',
                  letterSpacing: 1.2,
                }}
              >
                {s === 'me' ? 'Moi' : 'Foyer'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row border-b border-[#DCD7E8]">
        {(['day', 'week'] as const).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => onPeriodChange(p)}
              className="flex-1 py-3"
              accessibilityRole="button"
              accessibilityLabel={p === 'day' ? 'Jour' : 'Semaine'}
            >
              <Text
                className="text-center uppercase"
                style={{
                  fontFamily: active ? 'Nunito_700Bold' : 'Nunito_600SemiBold',
                  fontSize: 10,
                  color: active ? '#5F5475' : 'rgba(95,84,117,0.5)',
                  letterSpacing: 1.5,
                }}
              >
                {p === 'day' ? 'Jour' : 'Semaine'}
              </Text>
              {active && <View className="h-[2px] bg-[#967BB6] mt-2 mx-6 rounded-full" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
