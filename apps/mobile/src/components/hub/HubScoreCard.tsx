import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { useStats } from '@keurzen/queries';

export function HubScoreCard() {
  const router = useRouter();
  const stats = useStats({ scope: 'household', period: 'day' });

  const isLoading = stats.isLoading;
  const scoreValue = stats.score?.total ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>Score du jour</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeleton} />
      ) : scoreValue == null ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ajoute ta première tâche</Text>
          <Text style={styles.emptyBody}>
            Ton score d'équilibre apparaît dès que le foyer a des tâches suivies.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/tasks/create' as never)}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>NOUVELLE TÂCHE</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{Math.round(scoreValue)}</Text>
          <Text style={styles.valueUnit}>/100</Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(app)/dashboard' as never)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>VOIR LE TABLEAU DE BORD</Text>
        <Ionicons name="arrow-forward" size={14} color="#967BB6" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F8FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCD7E8',
    padding: 24,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#967BB6',
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#967BB6',
  },
  skeleton: {
    flex: 1,
    marginVertical: 20,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: 12,
  },
  value: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 72,
    color: '#5F5475',
    lineHeight: 80,
  },
  valueUnit: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20,
    color: 'rgba(95,84,117,0.6)',
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyWrap: {
    marginVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#5F5475',
  },
  emptyBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: 'rgba(95,84,117,0.7)',
    textAlign: 'center',
  },
  cta: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#967BB6',
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    minHeight: 44,
    paddingVertical: 12,
  },
  footerText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: '#967BB6',
  },
});
