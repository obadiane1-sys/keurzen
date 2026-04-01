import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import KeurzenMascot from '../src/components/ui/KeurzenMascot';
import { Text } from '../src/components/ui/Text';
import { useAuthStore } from '../src/stores/auth.store';
import { useUiStore } from '../src/stores/ui.store';

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
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotTranslateY = useRef(new Animated.Value(30)).current;
  const mascotScale = useRef(new Animated.Value(0.85)).current;

  // Text entrance
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mascot entrance
    Animated.timing(mascotOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.spring(mascotTranslateY, { toValue: 0, damping: 16, stiffness: 140, useNativeDriver: true }).start();
    Animated.spring(mascotScale, { toValue: 1, damping: 16, stiffness: 140, useNativeDriver: true }).start();

    // Title (delay 400ms)
    Animated.timing(titleOpacity, { toValue: 1, duration: 500, delay: 400, useNativeDriver: true }).start();
    Animated.timing(titleTranslateY, { toValue: 0, duration: 500, delay: 400, useNativeDriver: true }).start();

    // Tagline (delay 600ms)
    Animated.timing(taglineOpacity, { toValue: 1, duration: 500, delay: 600, useNativeDriver: true }).start();
    Animated.timing(taglineTranslateY, { toValue: 0, duration: 500, delay: 600, useNativeDriver: true }).start();

    // Dots (delay 900ms)
    Animated.timing(dotsOpacity, { toValue: 1, duration: 400, delay: 900, useNativeDriver: true }).start();
  }, [
    mascotOpacity, mascotTranslateY, mascotScale,
    titleOpacity, titleTranslateY,
    taglineOpacity, taglineTranslateY,
    dotsOpacity,
  ]);

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F5EFE0" />

      {/* BG Blobs */}
      <View style={[styles.blob, styles.blobMint]} />
      <View style={[styles.blob, styles.blobCoral]} />
      <View style={[styles.blob, styles.blobLavender]} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Mascot */}
        <Animated.View
          style={{
            opacity: mascotOpacity,
            transform: [
              { translateY: mascotTranslateY },
              { scale: mascotScale },
            ],
          }}
        >
          <KeurzenMascot expression="loading" size={150} animated />
        </Animated.View>

        {/* App name */}
        <Animated.View
          style={[
            styles.titleWrap,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleKeur}>Keur</Text>
          <Text style={styles.titleZen}>zen</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          }}
        >
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
    backgroundColor: '#F5EFE0',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Blobs
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.18,
  },
  blobMint: {
    width: 300,
    height: 300,
    backgroundColor: '#7DCCC3',
    top: -80,
    right: -80,
  },
  blobCoral: {
    width: 220,
    height: 220,
    backgroundColor: '#F0A898',
    bottom: -60,
    left: -60,
  },
  blobLavender: {
    width: 140,
    height: 140,
    backgroundColor: '#AFA9EC',
    bottom: 120,
    right: -30,
  },

  // Title
  titleWrap: {
    flexDirection: 'row',
    marginTop: 20,
  },
  titleKeur: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.5,
  },
  titleZen: {
    fontSize: 34,
    fontWeight: '800',
    color: '#7DCCC3',
    letterSpacing: -0.5,
  },

  // Tagline
  tagline: {
    fontSize: 14,
    color: '#6b6b8a',
    marginTop: 6,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#7DCCC3',
  },
});
