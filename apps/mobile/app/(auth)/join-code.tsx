import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/tokens';
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

  // Staggered fade-in animations
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(fadeAnim1, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim2, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim3, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim4, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4]);

  if (alreadyMemberHousehold) {
    return (
      <SafeAreaView style={styles.safe}>
        {/* Decorative blobs */}
        <View style={styles.blobMint} />
        <View style={styles.blobLavender} />

        <View style={styles.alreadyMemberContainer}>
          <Mascot size={100} expression="thinking" />
          <Text variant="h3" style={styles.alreadyMemberTitle}>
            Déjà membre
          </Text>
          <Text variant="body" color="secondary" style={styles.alreadyMemberSubtitle}>
            Vous faites déjà partie de {alreadyMemberHousehold}.
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
      {/* Decorative blobs */}
      <View style={styles.blobMint} />
      <View style={styles.blobLavender} />
      <View style={styles.blobCoral} />

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
          <Animated.View style={{ opacity: fadeAnim1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Retour"
              accessibilityRole="button"
            >
              <Text variant="label" color="terracotta">
                ← Retour
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim1 }]}>
            <Mascot size={72} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Rejoindre un foyer
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Saisissez le code à 6 chiffres que vous avez reçu par email.
            </Text>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View style={[styles.codeRow, { opacity: fadeAnim2 }]}>
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
                selectionColor={Colors.terracotta}
                accessibilityLabel={`Chiffre ${index + 1}`}
              />
            ))}
          </Animated.View>

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
          <Animated.View style={{ opacity: fadeAnim3 }}>
            <Button
              label="Rejoindre le foyer"
              onPress={handleSubmit}
              isLoading={isJoining}
              fullWidth
              size="lg"
              disabled={!isComplete}
              style={styles.submitBtn}
            />
          </Animated.View>

          {/* Info */}
          <Animated.View style={{ opacity: fadeAnim4 }}>
            {!session && (
              <Text variant="bodySmall" color="muted" style={styles.autoCreateHint}>
                Votre compte sera créé automatiquement.
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
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
    color: Colors.textPrimary,
  },
  codeCellFilled: {
    borderColor: Colors.terracotta,
    backgroundColor: Colors.terracotta + '08',
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
  // Decorative blobs
  blobMint: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    opacity: 0.1,
  },
  blobLavender: {
    position: 'absolute',
    bottom: 60,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.prune,
    opacity: 0.08,
  },
  blobCoral: {
    position: 'absolute',
    top: '45%',
    right: -30,
    width: 130,
    height: 130,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.rose,
    opacity: 0.09,
  },
});
