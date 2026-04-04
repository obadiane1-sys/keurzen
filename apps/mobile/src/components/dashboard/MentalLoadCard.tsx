import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { IconBrain } from './Icons';
import { MemberAvatar } from './MemberAvatar';
import { DCOLORS, DFONT } from './constants';

export interface TlxMember {
  name: string;
  avatarColor: string;
  tlxLevel: 'light' | 'medium' | 'heavy';
}

interface MentalLoadCardProps {
  members: TlxMember[];
}

const levelConfig = {
  light: {
    label: 'Légère',
    textColor: '#0F6E56',
    bg: DCOLORS.mintLight,
    borderColor: DCOLORS.mint + '4D',
    dotColor: DCOLORS.mint,
  },
  medium: {
    label: 'Moyenne',
    textColor: '#854F0B',
    bg: '#FAEEDA',
    borderColor: '#FFD166' + '4D',
    dotColor: '#FFD166',
  },
  heavy: {
    label: 'Lourde',
    textColor: '#993C1D',
    bg: DCOLORS.coralLight,
    borderColor: DCOLORS.coral + '4D',
    dotColor: DCOLORS.coral,
  },
};

export function MentalLoadCard({ members }: MentalLoadCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <IconBrain size={22} color={DCOLORS.lavender} />
          </View>
          <Text
            variant="h4"
            weight="semibold"
            style={{ color: DCOLORS.navy, fontSize: DFONT.subtitle.size }}
          >
            Charge mentale
          </Text>
        </View>
        <Text
          variant="caption"
          style={{ color: DCOLORS.textMuted, fontSize: DFONT.caption.size }}
        >
          Cette semaine
        </Text>
      </View>

      <View style={styles.membersList}>
        {members.map((member, i) => {
          const config = levelConfig[member.tlxLevel];
          return (
            <View key={i} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <MemberAvatar
                  name={member.name}
                  color={member.avatarColor}
                  size={34}
                />
                <Text
                  variant="body"
                  weight="medium"
                  style={{ color: DCOLORS.navy, fontSize: DFONT.body.size }}
                >
                  {member.name}
                </Text>
              </View>
              <View
                style={[
                  styles.levelPill,
                  {
                    backgroundColor: config.bg,
                    borderColor: config.borderColor,
                  },
                ]}
              >
                <View
                  style={[styles.levelDot, { backgroundColor: config.dotColor }]}
                />
                <Text
                  variant="caption"
                  weight="semibold"
                  style={{ fontSize: 13, color: config.textColor }}
                >
                  {config.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DCOLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: DCOLORS.border,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DCOLORS.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersList: {
    gap: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  levelDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
