import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';
import type { MockAlert } from './constants';

interface AlertCardProps {
  alert: MockAlert;
  fullWidth?: boolean;
}

export function AlertCard({ alert, fullWidth }: AlertCardProps) {
  const isSocial = alert.type === 'social';

  if (isSocial && fullWidth) {
    return (
      <View style={[styles.card, styles.socialCard]}>
        <View style={styles.socialContent}>
          <View style={styles.blobIcon}>
            <MaterialCommunityIcons
              name={alert.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={24}
              color={alert.color}
            />
          </View>
          <View style={styles.socialText}>
            <View style={[styles.pill, { borderColor: alert.color }]}>
              <Text style={[styles.pillText, { color: alert.color }]}>{alert.label}</Text>
            </View>
            <Text style={styles.socialTitle}>{alert.title}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>{alert.actionLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.smallCard, { borderTopColor: alert.color }]}>
      <View style={styles.smallHeader}>
        <View style={[styles.pill, { borderColor: alert.color }]}>
          <Text style={[styles.pillText, { color: alert.color }]}>{alert.label}</Text>
        </View>
        <View style={styles.blobIconSmall}>
          <MaterialCommunityIcons
            name={alert.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={14}
            color={alert.color}
          />
        </View>
      </View>
      <Text style={styles.smallTitle}>{alert.title}</Text>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={[styles.actionText, { color: alert.color }]}>
          {alert.actionLabel}{' '}
          <MaterialCommunityIcons name="chevron-right" size={12} color={alert.color} />
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
  },
  smallCard: {
    padding: 16,
    borderTopWidth: 4,
  },
  smallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  blobIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  blobIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    flex: 1,
  },
  socialTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    ...Shadows.md,
  },
  sendButtonText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
