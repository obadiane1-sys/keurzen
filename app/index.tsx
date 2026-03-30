import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import KeurzenMascot from '../src/components/ui/KeurzenMascot';
import { Text } from '../src/components/ui/Text';
import { useAuthStore } from '../src/stores/auth.store';

// ─── Loading Dots ───────────────────────────────────────────────────────────

function LoadingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.7, { duration: 600 }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.25, { duration: 600 }),
        ),
        -1,
      ),
    );
  }, [delay, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

// ─── Splash Screen ──────────────────────────────────────────────────────────

export default function SplashScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isInitialized } = useAuthStore();
  const hasNavigated = useRef(false);
  const loadedAt = useRef(Date.now());

  // Mascot entrance
  const mascotOpacity = useSharedValue(0);
  const mascotTranslateY = useSharedValue(30);
  const mascotScale = useSharedValue(0.85);

  // Text entrance
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(10);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(10);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Mascot entrance
    mascotOpacity.value = withTiming(1, { duration: 800 });
    mascotTranslateY.value = withSpring(0, { damping: 16, stiffness: 140 });
    mascotScale.value = withSpring(1, { damping: 16, stiffness: 140 });

    // Title
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 500 }));

    // Tagline
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineTranslateY.value = withDelay(600, withTiming(0, { duration: 500 }));

    // Dots
    dotsOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
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
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [isInitialized, session, router, pathname]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [
      { translateY: mascotTranslateY.value },
      { scale: mascotScale.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

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
        <Animated.View style={mascotStyle}>
          <KeurzenMascot expression="loading" size={150} animated />
        </Animated.View>

        {/* App name */}
        <Animated.View style={[styles.titleWrap, titleStyle]}>
          <Text style={styles.titleKeur}>Keur</Text>
          <Text style={styles.titleZen}>zen</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Votre foyer, organisé ensemble</Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, dotsStyle]}>
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
