import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../src/constants/tokens';
import { Text } from '../src/components/ui/Text';
import { Button } from '../src/components/ui/Button';
import { Mascot } from '../src/components/ui/Mascot';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Mascot size={100} expression="thinking" />
        <Text variant="h3" style={styles.title}>Page introuvable</Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Cette page n'existe pas ou le lien est invalide.
        </Text>
        <Button
          label="Retour a l'accueil"
          variant="primary"
          onPress={() => router.replace('/')}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: Spacing.lg,
    width: '100%',
  },
});
