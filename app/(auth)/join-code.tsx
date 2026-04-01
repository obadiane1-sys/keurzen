import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import { useJoinCode } from '../../src/hooks/useJoinCode';

export default function JoinCodeScreen() {
  const router = useRouter();
  const {
    digits,
    error,
    isJoining,
    isComplete,
    alreadyMemberHousehold,
    handleChange,
    handleKeyPress,
    handlePaste,
    handleSubmit,
    resetAlreadyMember,
    inputRefs,
    session,
  } = useJoinCode();

  if (alreadyMemberHousehold) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.alreadyMemberContainer}>
          <Mascot size={100} expression="thinking" />
          <Text variant="h3" style={styles.alreadyMemberTitle}>
            D\u00e9j\u00e0 membre
          </Text>
          <Text variant="body" color="secondary" style={styles.alreadyMemberSubtitle}>
            Vous faites d\u00e9j\u00e0 partie de {alreadyMemberHousehold}.
          </Text>
          <Button
            label="Aller au dashboard"
            onPress={() => router.replace('/(app)/dashboard')}
            fullWidth
            style={styles.alreadyMemberBtn}
          />
          <Button
            label="Retour"
            variant="ghost"
            onPress={resetAlreadyMember}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Text variant="label" color="mint">
              \u2190 Retour
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Mascot size={72} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Rejoindre un foyer
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Saisissez le code \u00e0 6 chiffres que vous avez re\u00e7u par email.
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.codeRow}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeCell,
                  digit ? styles.codeCellFilled : undefined,
                  error ? styles.codeCellError : undefined,
                ]}
                value={digit}
                onChangeText={(text) => {
                  if (text.length > 1) {
                    handlePaste(text);
                  } else {
                    handleChange(text, index);
                  }
                }}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                selectionColor={Colors.mint}
                accessibilityLabel={`Chiffre ${index + 1}`}
              />
            ))}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text variant="bodySmall" style={{ color: Colors.error, flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {/* Submit */}
          <Button
            label="Rejoindre le foyer"
            onPress={handleSubmit}
            isLoading={isJoining}
            fullWidth
            size="lg"
            disabled={!isComplete}
            style={styles.submitBtn}
          />

          {/* Info : le compte est cr\u00e9\u00e9 automatiquement */}
          {!session && (
            <Text variant="bodySmall" color="muted" style={styles.autoCreateHint}>
              Votre compte sera cr\u00e9\u00e9 automatiquement.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  backBtn: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  title: {
    marginTop: Spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
    lineHeight: 22,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  codeCell: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    textAlign: 'center',
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.navy,
    ...Shadows.sm,
  },
  codeCellFilled: {
    borderColor: Colors.mint,
    backgroundColor: Colors.mint + '08',
  },
  codeCellError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '08',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  autoCreateHint: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  alreadyMemberContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  alreadyMemberTitle: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  alreadyMemberSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  alreadyMemberBtn: {
    marginTop: Spacing.lg,
  },
});
