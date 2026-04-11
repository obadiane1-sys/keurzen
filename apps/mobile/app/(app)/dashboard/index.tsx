import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { DashboardTabs, type DashboardTabKey } from '../../../src/components/dashboard/DashboardTabs';
import { InsightsTab } from '../../../src/components/dashboard/InsightsTab';
import { StatsTab } from '../../../src/components/dashboard/StatsTab';
import { TasksTab } from '../../../src/components/dashboard/TasksTab';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const [activeTab, setActiveTab] = useState<DashboardTabKey>('insights');

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-xl" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
            Bienvenue
          </Text>
          <Mascot size={44} expression="calm" />
        </View>
        <EmptyState
          variant="household"
          expression="normal"
          title="Votre foyer vous attend"
          subtitle="Creez un foyer ou rejoignez-en un avec un code d'invitation."
          action={{ label: 'Creer un foyer', onPress: () => router.navigate('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#00E5FF"
            colors={['#00E5FF']}
          />
        }
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-6 pt-8 pb-2">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            {/* Avatar */}
            <View className="w-12 h-12 bg-surface rounded-full shadow-soft items-center justify-center border-2 border-primary/20 p-0.5">
              <Mascot size={40} expression="calm" />
            </View>
            <Text className="text-xl" style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}>
              Bonjour, <Text style={{ color: '#00E5FF' }}>{firstName}</Text> {'\u2728'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-2xl shadow-badge border border-border bg-surface"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/(app)/notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#2D3748" />
            {/* Red dot for unread */}
            <View
              className="absolute bg-danger rounded-full border-2 border-surface"
              style={{ top: 4, right: 4, width: 10, height: 10 }}
            />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* TAB CONTENT */}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'tasks' && <TasksTab />}
      </ScrollView>
    </SafeAreaView>
  );
}
