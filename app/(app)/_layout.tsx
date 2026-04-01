import { Tabs, Redirect, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { Colors, Spacing, Shadows, BorderRadius, Typography } from '../../src/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Loader } from '../../src/components/ui/Loader';
import { Text } from '../../src/components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadCount } from '../../src/lib/queries/notifications';

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

function NotificationBell() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/notifications')}
      style={styles.bellContainer}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
      accessibilityRole="button"
    >
      <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const TAB_CONFIG = [
  { name: 'dashboard', label: 'Tableau', icon: 'grid' as const, color: Colors.coral },
  { name: 'tasks', label: 'Taches', icon: 'checkmark-circle' as const, color: Colors.mint },
  { name: 'calendar', label: 'Agenda', icon: 'calendar' as const, color: Colors.lavender },
  { name: 'budget', label: 'Budget', icon: 'wallet' as const, color: Colors.blue },
  { name: 'settings', label: 'Profil', icon: 'person' as const, color: Colors.textSecondary },
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
            ...(name === 'dashboard' && {
              headerShown: true,
              headerTitle: '',
              headerStyle: { backgroundColor: Colors.background, elevation: 0, shadowOpacity: 0 },
              headerRight: () => <NotificationBell />,
              headerRightContainerStyle: { paddingRight: Spacing.base },
            }),
          }}
        />
      ))}
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
    fontWeight: '500',
    marginTop: 0,
  },
  bellContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
});
