import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../src/components/ui/Text';

export default function HubScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
          Hub
        </Text>
        <Text className="text-sm mt-2 text-center" style={{ fontFamily: 'Outfit_400Regular', color: '#718096' }}>
          Votre centre de commandes
        </Text>
      </View>
    </SafeAreaView>
  );
}
