import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { Mascot } from '../ui/Mascot';

export function StatsEmptyState() {
  return (
    <View className="items-center justify-center px-10 py-16">
      <Mascot size={96} />
      <Text
        className="text-center mt-6"
        style={{ fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#5F5475' }}
      >
        Pas encore de donnees
      </Text>
      <Text
        className="text-center mt-2"
        style={{
          fontFamily: 'Nunito_500Medium',
          fontSize: 13,
          color: 'rgba(95,84,117,0.7)',
          lineHeight: 20,
        }}
      >
        Complete quelques taches et tes statistiques s'afficheront ici.
      </Text>
    </View>
  );
}
