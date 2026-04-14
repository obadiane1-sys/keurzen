import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';

interface Props {
  score: number;
  delta: number | null;
  coachMessage: string | null;
}

export function ScoreHero({ score, delta, coachMessage }: Props) {
  return (
    <View className="items-center py-8">
      <Text
        className="uppercase"
        style={{
          fontFamily: 'Nunito_700Bold',
          fontSize: 10,
          letterSpacing: 2,
          color: 'rgba(95,84,117,0.5)',
        }}
      >
        Score global
      </Text>
      <View className="flex-row items-baseline mt-3">
        <Text
          style={{
            fontFamily: 'Nunito_800ExtraBold',
            fontSize: 88,
            color: '#5F5475',
            lineHeight: 96,
          }}
        >
          {score}
        </Text>
        {delta !== null && delta !== 0 && (
          <Text
            className="ml-2"
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: 14,
              color: delta >= 0 ? '#81C784' : '#E07A5F',
            }}
          >
            {delta > 0 ? '+' : ''}
            {delta}%
          </Text>
        )}
      </View>
      {coachMessage && (
        <Text
          className="mt-4 italic text-center px-4"
          style={{
            fontFamily: 'Nunito_500Medium',
            fontSize: 13,
            color: 'rgba(95,84,117,0.7)',
          }}
        >
          « {coachMessage} »
        </Text>
      )}
      <View className="w-10 h-[1px] bg-[#DCD7E8] mt-6" />
    </View>
  );
}
