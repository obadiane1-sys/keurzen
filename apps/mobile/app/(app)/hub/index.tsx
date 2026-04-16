import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HubHeader,
  HubCarousel,
  HubTilesGrid,
} from '../../../src/components/hub';

export default function HubScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <HubHeader />
        <HubCarousel />
        <View style={{ height: 24 }} />
        <HubTilesGrid />
      </ScrollView>
    </SafeAreaView>
  );
}
