import { Tabs, Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { Colors, Typography } from '../../src/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Loader } from '../../src/components/ui/Loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  const iconName = focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap);
  return (
    <Ionicons
      name={iconName}
      size={24}
      color={focused ? Colors.textPrimary : Colors.textMuted}
    />
  );
}

const TAB_CONFIG = [
  { name: 'dashboard', label: 'Accueil', icon: 'home' as const },
  { name: 'tasks', label: 'Taches', icon: 'swap-horizontal' as const },
  { name: 'menu', label: 'Hub', icon: 'grid' as const },
] as const;

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isInitialized) return <Loader fullScreen />;

  if (!session) return <Redirect href="/(auth)/login" />;

  const tabBarHeight = 52 + (insets.bottom > 0 ? insets.bottom : 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          { height: tabBarHeight, paddingBottom: insets.bottom > 0 ? insets.bottom : 4 },
        ],
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      {TAB_CONFIG.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ focused }) => (
              <TabIcon name={icon} focused={focused} />
            ),
          }}
        />
      ))}
      {/* Hidden from tabs — accessible via Hub */}
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="lists" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="meals" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      {/* Hidden — full-screen flows */}
      <Tabs.Screen
        name="notifications"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
});
