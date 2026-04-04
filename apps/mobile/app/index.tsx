import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import KeurzenMascot from '../src/components/ui/KeurzenMascot';
import { Text } from '../src/components/ui/Text';
import { useAuthStore } from '../src/stores/auth.store';
import { useUiStore } from '../src/stores/ui.store';
import { Colors, Spacing, Typography, BorderRadius } from '../src/constants/tokens';

/** Filet de sécurité ultime si isInitialized n'est jamais true (ms) */
const SPLASH_SAFETY_TIMEOUT = 10000;

// ─── Loading Dots ───────────────────────────────────────────────────────────

function LoadingDot({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.7, duration: 600, useNativeDriver: true }),
      ]),
    );
    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 600, useNativeDriver: true }),
      ]),
    );
    scaleAnim.start();
    opacityAnim.start();
    return () => {
      scaleAnim.stop();
      opacityAnim.stop();
    };
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

// ─── Splash Screen ──────────────────────────────────────────────────────────

export default function SplashScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isInitialized } = useAuthStore();
  const { pendingInviteToken, pendingInviteCode } = useUiStore();
  const hasNavigated = useRef(false);
  const loadedAt = useRef(Date.now());

  // Mascot entrance
  const mascotTranslateY = useRef(new Animated.Value(20)).current;
  const mascotScale = useRef(new Animated.Value(0.9)).current;

  // Text entrance
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mascot entrance (visible immediately, just slides up)
    Animated.spring(mascotTranslateY, { toValue: 0, damping: 16, stiffness: 140, useNativeDriver: true }).start();
    Animated.spring(mascotScale, { toValue: 1, damping: 16, stiffness: 140, useNativeDriver: true }).start();

    // Title + tagline + dots stagger
    Animated.stagger(180, [
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [mascotTranslateY, mascotScale, titleOpacity, taglineOpacity, dotsOpacity]);

  // Navigate once auth is ready + minimum time elapsed
  useEffect(() => {
    if (!isInitialized || hasNavigated.current) return;

    // Guard: on web, during route resolution the index may render briefly
    // while the actual URL is /join/*. Never redirect away from a join flow.
    if (pathname.startsWith('/join')) return;

    const elapsed = Date.now() - loadedAt.current;
    const remaining = Math.max(0, 1800 - elapsed);

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      if (session) {
        // Priorité aux invitations en attente
        if (pendingInviteToken) {
          router.replace(`/join/${pendingInviteToken}` as `/${string}`);
        } else if (pendingInviteCode) {
          router.replace(`/(auth)/join-code?code=${pendingInviteCode}`);
        } else {
          router.replace('/(app)/dashboard');
        }
      } else {
        if (pendingInviteCode) {
          router.replace(`/(auth)/join-code?code=${pendingInviteCode}`);
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [isInitialized, session, router, pathname, pendingInviteToken, pendingInviteCode]);

  // Filet de sécurité ultime : si isInitialized n'est jamais true, naviguer vers login
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!hasNavigated.current) {
        console.warn('[Keurzen] Safety timeout ' + SPLASH_SAFETY_TIMEOUT + 'ms — redirecting to login');
        hasNavigated.current = true;
        router.replace('/(auth)/login');
      }
    }, SPLASH_SAFETY_TIMEOUT);

    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* BG Blobs */}
      <View style={[styles.blob, styles.blobMint]} />
      <View style={[styles.blob, styles.blobCoral]} />
      <View style={[styles.blob, styles.blobLavender]} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Mascot */}
        <Animated.View
          style={{
            transform: [
              { translateY: mascotTranslateY },
              { scale: mascotScale },
            ],
          }}
        >
          <KeurzenMascot expression="loading" size={150} animated />
        </Animated.View>

        {/* App name */}
        <Animated.View style={[styles.titleWrap, { opacity: titleOpacity }]}>
          <Text style={styles.titleKeur}>Keur</Text>
          <Text style={styles.titleZen}>zen</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: taglineOpacity }}>
          <Text style={styles.tagline}>Votre foyer, organise ensemble</Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Blobs
  blob: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    opacity: 0.15,
  },
  blobMint: {
    width: 300,
    height: 300,
    backgroundColor: Colors.terracotta,
    top: -80,
    right: -80,
  },
  blobCoral: {
    width: 220,
    height: 220,
    backgroundColor: Colors.rose,
    bottom: -60,
    left: -60,
  },
  blobLavender: {
    width: 140,
    height: 140,
    backgroundColor: Colors.prune,
    bottom: 120,
    right: -30,
  },

  // Title
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  titleKeur: {
    fontSize: Typography.fontSize['4xl'],
    lineHeight: Typography.fontSize['4xl'] * 1.2,
    fontFamily: Typography.fontFamily.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleZen: {
    fontSize: Typography.fontSize['4xl'],
    lineHeight: Typography.fontSize['4xl'] * 1.2,
    fontFamily: Typography.fontFamily.extrabold,
    color: Colors.terracotta,
    letterSpacing: -0.5,
  },

  // Tagline
  tagline: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing['3xl'],
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
  },
});
