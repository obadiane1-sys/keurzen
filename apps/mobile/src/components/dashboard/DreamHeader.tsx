import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Mascot } from '../ui/Mascot';
import { Colors, Shadows } from '../../constants/tokens';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

interface DreamHeaderProps {
  firstName: string;
}

export function DreamHeader({ firstName }: DreamHeaderProps) {
  const router = useRouter();
  const today = dayjs();
  const dateLabel = today.format('dddd D MMMM');
  const dateDisplay = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.mascotWrapper}>
          <Mascot size={40} expression="calm" />
        </View>
        <View>
          <Text style={styles.date}>{dateDisplay}</Text>
          <Text style={styles.greeting}>
            Bonjour, <Text style={styles.name}>{firstName}</Text>
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.notifButton}
        accessibilityLabel="Notifications"
        onPress={() => router.push('/(app)/notifications')}
      >
        <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.textPrimary} />
        <View style={styles.notifDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotWrapper: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    transform: [{ rotate: '3deg' }],
    ...Shadows.sm,
  },
  date: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  name: {
    color: Colors.accent,
  },
  notifButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
