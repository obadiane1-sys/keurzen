import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { Loader } from '../../src/components/ui/Loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../src/components/ui/Text';

const VISIBLE_TABS = [
  { route: 'dashboard', label: 'Accueil', icon: 'home' as keyof typeof MaterialCommunityIcons.glyphMap },
  { route: 'tasks', label: 'Taches', icon: 'clipboard-check-outline' as keyof typeof MaterialCommunityIcons.glyphMap },
  { route: 'stats', label: 'Stats', icon: 'chart-bar' as keyof typeof MaterialCommunityIcons.glyphMap },
  { route: 'hub', label: 'Hub', icon: 'view-grid-outline' as keyof typeof MaterialCommunityIcons.glyphMap },
];

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      {VISIBLE_TABS.map((tab, index) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.route);
        const isFocused = state.index === routeIndex;

        const items: React.ReactNode[] = [];

        // Insert FAB after 2nd tab (before stats)
        if (index === 2) {
          items.push(
            <TouchableOpacity
              key="fab"
              onPress={() => router.push('/(app)/tasks/create')}
              activeOpacity={0.85}
              style={styles.fab}
            >
              <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          );
        }

        items.push(
          <TouchableOpacity
            key={tab.route}
            onPress={() => navigation.navigate(tab.route)}
            style={styles.tabItem}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isFocused ? '#90CAF9' : '#A0AEC0'}
            />
            <Text style={[styles.label, { color: isFocused ? '#90CAF9' : '#A0AEC0' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );

        return items;
      })}
    </View>
  );
}

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) return <Loader fullScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="hub" />
      {/* Hidden routes — accessible via Hub */}
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="lists" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="meals" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E9EC',
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#90CAF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
    shadowColor: '#90CAF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
