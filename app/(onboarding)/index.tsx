import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markOnboardingSeen } from '../../src/lib/supabase/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  mascotExpression: 'calm' | 'happy' | 'thinking' | 'celebrate';
  mascotColor: string;
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Un foyer plus équilibré,\nen toute simplicité',
    subtitle: 'Keurzen vous aide à répartir les tâches équitablement et à visualiser la charge de chaque membre de votre foyer.',
    mascotExpression: 'calm',
    mascotColor: Colors.mint,
    accentColor: Colors.mint,
  },
  {
    id: '2',
    title: "L'équité,\nenfin visible",
    subtitle: 'Suivez en temps réel qui fait quoi, combien de temps cela prend, et repérez les déséquilibres avant qu\'ils s\'installent.',
    mascotExpression: 'happy',
    mascotColor: Colors.blue,
    accentColor: Colors.blue,
  },
  {
    id: '3',
    title: 'Votre charge mentale\ncompte',
    subtitle: 'Le NASA-TLX adapté au foyer vous permet de mesurer objectivement votre ressenti et d\'ouvrir le dialogue.',
    mascotExpression: 'thinking',
    mascotColor: Colors.lavender,
    accentColor: Colors.lavender,
  },
  {
    id: '4',
    title: 'Faites le premier pas\nvers l\'équilibre',
    subtitle: 'Commencez par ajouter votre première tâche ou explorez votre tableau de bord.',
    mascotExpression: 'celebrate',
    mascotColor: Colors.coral,
    accentColor: Colors.coral,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setProfile, profile } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useMemo(() => new Animated.Value(0), []);

const markSeen = async () => {
  if (user?.id) {
    await markOnboardingSeen(user.id);
    if (profile) {
      setProfile({ ...profile, has_seen_onboarding: true });
    }
  }
};

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await markSeen();
    router.replace('/(app)/dashboard');
  };

  const handleCTA = async (target: 'task' | 'dashboard') => {
    await markSeen();
    if (target === 'task') {
      router.replace('/(app)/dashboard');
      // Could open task modal via store after nav
    } else {
      router.replace('/(app)/dashboard');
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: ListRenderItemInfo<OnboardingSlide>) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.mascotContainer, { backgroundColor: item.accentColor + '15' }]}>
          <Mascot
            size={160}
            expression={item.mascotExpression}
            color={item.mascotColor}
          />
        </View>

        <Text variant="h2" style={styles.slideTitle}>
          {item.title}
        </Text>

        <Text variant="body" color="secondary" style={styles.slideSubtitle}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text variant="label" color="muted">Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: SLIDES[currentIndex].accentColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA buttons */}
        {isLast ? (
          <View style={styles.ctaGroup}>
            <Button
              label="Ajouter une tâche"
              onPress={() => handleCTA('task')}
              variant="primary"
              fullWidth
              size="lg"
            />
            <Button
              label="Accéder au tableau de bord"
              onPress={() => handleCTA('dashboard')}
              variant="secondary"
              fullWidth
              size="lg"
            />
          </View>
        ) : (
          <Button
            label="Suivant →"
            onPress={handleNext}
            variant="primary"
            fullWidth
            size="lg"
            style={styles.nextBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: Spacing.base,
    marginRight: Spacing.sm,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.xl,
  },
  mascotContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  slideTitle: {
    textAlign: 'center',
    lineHeight: 36,
  },
  slideSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 12,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  ctaGroup: {
    width: '100%',
    gap: Spacing.sm,
  },
  nextBtn: {
    width: '100%',
  },
});
