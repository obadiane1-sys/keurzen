import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Mascot } from '../../../src/components/ui/Mascot';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { faqData, type FaqItem } from '../../../src/constants/faq';

// ─── FAQ Accordion ───────────────────────────────────────────────────────────

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setOpen(!open)}
      activeOpacity={0.85}
      style={styles.faqItem}
    >
      <View style={styles.faqHeader}>
        <Text variant="label" style={styles.faqQuestion}>
          {item.question}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textMuted}
        />
      </View>
      {open && (
        <Text variant="body" color="secondary" style={styles.faqAnswer}>
          {item.answer}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HelpScreen() {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleContact = () => {
    Linking.openURL('mailto:contact@keurzen.app?subject=Aide%20Keurzen');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Aide" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot + intro */}
        <View style={styles.heroSection}>
          <Mascot size={80} expression="happy" />
          <Text variant="h4" style={styles.heroTitle}>
            Comment pouvons-nous vous aider ?
          </Text>
        </View>

        {/* FAQ */}
        <Text variant="overline" color="muted" style={styles.sectionLabel}>
          Questions frequentes
        </Text>
        <Card padding="none">
          {faqData.map((item, index) => (
            <View key={index}>
              <FaqAccordion item={item} />
              {index < faqData.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Contact */}
        <Text variant="overline" color="muted" style={styles.sectionLabel}>
          Nous contacter
        </Text>
        <Card onPress={handleContact} padding="md">
          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={20} color={Colors.terracotta} />
            </View>
            <View style={styles.contactText}>
              <Text variant="label">Envoyer un email</Text>
              <Text variant="bodySmall" color="secondary">
                contact@keurzen.app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </Card>

        {/* Version */}
        <Text
          variant="caption"
          color="muted"
          style={styles.version}
        >
          Keurzen v{appVersion}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  heroTitle: {
    textAlign: 'center',
  },
  sectionLabel: {
    marginTop: Spacing.md,
  },
  faqItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
  },
  faqAnswer: {
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.terracotta + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
