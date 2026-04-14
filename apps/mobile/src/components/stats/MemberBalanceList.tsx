import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '../ui/Text';
import type { MemberBalance } from '@keurzen/queries';

interface Props {
  members: MemberBalance[];
}

function labelFor(level: MemberBalance['level']): { text: string; color: string } {
  switch (level) {
    case 'unbalanced':
      return { text: 'Charge elevee', color: '#E07A5F' };
    case 'watch':
      return { text: 'A surveiller', color: '#F4A261' };
    default:
      return { text: 'Equilibre ideal', color: '#967BB6' };
  }
}

export function MemberBalanceList({ members }: Props) {
  return (
    <View className="px-6 pt-6">
      <Text
        className="uppercase pb-4 border-b border-[#DCD7E8]/50"
        style={{
          fontFamily: 'Nunito_700Bold',
          fontSize: 12,
          letterSpacing: 2,
          color: '#5F5475',
        }}
      >
        Repartition
      </Text>
      <View className="pt-6 gap-6">
        {members.map((m) => {
          const pct = Math.round(m.tasksShare * 100);
          const label = labelFor(m.level);
          return (
            <View key={m.userId} className="flex-row items-center gap-4">
              {m.avatarUrl ? (
                <Image source={{ uri: m.avatarUrl }} className="w-12 h-12 rounded-full" />
              ) : (
                <View className="w-12 h-12 rounded-full bg-[#F3F0FF] items-center justify-center">
                  <Text style={{ fontFamily: 'Nunito_700Bold', color: '#967BB6' }}>
                    {m.name.slice(0, 1)}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row justify-between items-baseline">
                  <Text
                    style={{
                      fontFamily: 'Nunito_600SemiBold',
                      fontSize: 14,
                      color: '#5F5475',
                    }}
                  >
                    {m.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: 18,
                      color: '#5F5475',
                    }}
                  >
                    {pct}%
                  </Text>
                </View>
                <View className="h-[3px] bg-[#F3F0FF] rounded-full mt-2 overflow-hidden">
                  <View
                    style={{
                      width: `${pct}%`,
                      backgroundColor: label.color,
                      height: '100%',
                    }}
                  />
                </View>
                <Text
                  className="uppercase mt-2"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 9,
                    letterSpacing: 1.2,
                    color: label.color,
                  }}
                >
                  {label.text}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
