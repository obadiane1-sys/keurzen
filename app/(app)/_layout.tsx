import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { Colors, Shadows, BorderRadius, Typography } from '../../src/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Loader } from '../../src/components/ui/Loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({
  name,
  focused,
  activeColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  activeColor: string;
}) {
  const iconName = focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap);
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: activeColor + '18' }]}>
      <Ionicons name={iconName} size={22} color={focused ? activeColor : Colors.textMuted} />
    </View>
  );
}

const TAB_CONFIG = [
  { name: 'dashboard', label: 'Accueil', icon: 'home' as const, color: Colors.terracotta },
  { name: 'tasks', label: 'Taches', icon: 'checkmark-circle' as const, color: Colors.terracotta },
  { name: 'calendar', label: 'Agenda', icon: 'calendar' as const, color: Colors.terracotta },
  { name: 'budget', label: 'Budget', icon: 'wallet' as const, color: Colors.terracotta },
  { name: 'menu', label: 'Menu', icon: 'menu' as const, color: Colors.terracotta },
] as const;

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isInitialized) return <Loader fullScreen />;

  if (!session) return <Redirect href="/(auth)/login" />;

  const tabBarHeight = 56 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          { height: tabBarHeight, paddingBottom: insets.bottom > 0 ? insets.bottom : 6 },
        ],
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TAB_CONFIG.map(({ name, label, icon, color }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarLabel: label,
            tabBarActiveTintColor: color,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarIcon: ({ focused }) => (
              <TabIcon name={icon} focused={focused} activeColor={color} />
            ),
          }}
        />
      ))}
      {/* Hidden from tabs — accessible via Menu */}
      <Tabs.Screen
        name="lists"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      {/* Hidden from tabs — accessible via bell icon */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      {/* Hidden from tabs — post-join onboarding flow */}
      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    ...Shadows.md,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 0,
  },
});
