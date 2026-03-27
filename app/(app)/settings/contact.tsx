import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Nous contacter</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card>
          <Text variant="body" color="secondary" style={{ lineHeight: 22 }}>
            Une question, une suggestion ou un problème ? Nous sommes là pour vous aider.
          </Text>

          <Button
            label="Envoyer un email"
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Ionicons name="mail-outline" size={18} color="white" />}
            onPress={() => Linking.openURL('mailto:support@keurzen.app?subject=Support Keurzen')}
            style={{ marginTop: Spacing.base }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
});
