import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import type { StatsKpi } from '@keurzen/queries';

interface Props {
  kpis: StatsKpi[];
}

export function KpiGrid({ kpis }: Props) {
  return (
    <View className="flex-row flex-wrap px-6 py-6">
      {kpis.map((kpi) => (
        <View key={kpi.key} className="w-1/2 mb-8 pr-4">
          <Text
            className="uppercase"
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: 9,
              letterSpacing: 1.5,
              color: 'rgba(95,84,117,0.5)',
            }}
          >
            {kpi.label}
          </Text>
          <View className="flex-row items-baseline mt-2">
            <Text
              style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#5F5475' }}
            >
              {kpi.value}
            </Text>
            {kpi.unit && (
              <Text
                className="ml-1"
                style={{
                  fontFamily: 'Nunito_500Medium',
                  fontSize: 11,
                  color: 'rgba(95,84,117,0.5)',
                }}
              >
                {kpi.unit}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
