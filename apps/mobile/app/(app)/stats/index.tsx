import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../src/components/ui/Text';

export default function StatsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
          Statistiques
        </Text>
        <Text className="text-sm mt-2 text-center" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
          Page de statistiques detaillees a venir
        </Text>
      </View>
    </SafeAreaView>
  );
}
