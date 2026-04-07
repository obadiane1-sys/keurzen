'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { useAuthStore } from '@keurzen/stores';
import { markOnboardingSeen, getSupabaseClient } from '@keurzen/queries';

// ─── Types ───────────────────────────────────────────────────────────────────

type HouseholdType = 'solo' | 'couple' | 'family' | 'large_family';
type CurrentSplit = 'mainly_me' | 'equal' | 'varies' | 'starting';
type PainPoint = 'meals' | 'chores' | 'planning' | 'finances';
type MainGoal = 'mental_relief' | 'overview' | 'balance' | 'save_time';

interface OnboardingAnswers {
  household_type: HouseholdType | null;
  current_split: CurrentSplit | null;
  pain_point: PainPoint | null;
  main_goal: MainGoal | null;
}

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  {
    question: 'Comment est compose votre foyer ?',
    field: 'household_type' as const,
    options: [
      { emoji: '🧑', label: 'Je vis seul·e', value: 'solo' as HouseholdType },
      { emoji: '👫', label: 'En couple', value: 'couple' as HouseholdType },
      { emoji: '👨‍👩‍👧', label: 'Famille avec enfants', value: 'family' as HouseholdType },
      { emoji: '👨‍👩‍👧‍👦', label: 'Grande famille', value: 'large_family' as HouseholdType },
    ],
  },
  {
    question: "Qui gere le foyer aujourd'hui ?",
    field: 'current_split' as const,
    options: [
      { emoji: '💪', label: 'Principalement moi', value: 'mainly_me' as CurrentSplit },
      { emoji: '🤝', label: 'On se partage equitablement', value: 'equal' as CurrentSplit },
      { emoji: '🔄', label: 'Ca varie beaucoup', value: 'varies' as CurrentSplit },
      { emoji: '🆕', label: "On commence a s'organiser", value: 'starting' as CurrentSplit },
    ],
  },
  {
    question: "Qu'est-ce qui vous prend le plus d'energie ?",
    field: 'pain_point' as const,
    options: [
      { emoji: '🛒', label: 'Les courses et repas', value: 'meals' as PainPoint },
      { emoji: '🧹', label: 'Les taches menageres', value: 'chores' as PainPoint },
      { emoji: '📅', label: "L'organisation generale", value: 'planning' as PainPoint },
      { emoji: '💰', label: 'Les finances du foyer', value: 'finances' as PainPoint },
    ],
  },
  {
    question: "Qu'attendez-vous de Keurzen ?",
    field: 'main_goal' as const,
    options: [
      { emoji: '🧘', label: "Me decharger l'esprit", value: 'mental_relief' as MainGoal },
      { emoji: '👁️', label: "Avoir une vue d'ensemble", value: 'overview' as MainGoal },
      { emoji: '⚖️', label: 'Mieux equilibrer avec mon partenaire', value: 'balance' as MainGoal },
      { emoji: '⚡', label: 'Gagner du temps au quotidien', value: 'save_time' as MainGoal },
    ],
  },
];

// ─── Save helper ─────────────────────────────────────────────────────────────

async function savePreferences(
  userId: string,
  answers: {
    household_type: HouseholdType;
    current_split: CurrentSplit;
    pain_point: PainPoint;
    main_goal: MainGoal;
  }
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('onboarding_preferences')
    .upsert(
      { user_id: userId, ...answers, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) console.warn('[Keurzen] Failed to save onboarding preferences:', error.message);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingSetupPage() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    household_type: null,
    current_split: null,
    pain_point: null,
    main_goal: null,
  });

  const currentStep = STEPS[step];
  const selectedValue = answers[currentStep?.field];

  // ── Handlers ──

  function handleSelect(value: string) {
    if (!currentStep) return;
    setAnswers((prev) => ({ ...prev, [currentStep.field]: value }));
  }

  async function handleNext() {
    if (!selectedValue) return;

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Last step → save and complete
    setLoading(true);
    try {
      if (user) {
        await savePreferences(user.id, {
          household_type: answers.household_type!,
          current_split: answers.current_split!,
          pain_point: answers.pain_point!,
          main_goal: answers.main_goal!,
        });
        await markOnboardingSeen(user.id);
      }
      if (profile) setProfile({ ...profile, has_seen_onboarding: true });
      setDone(true);
    } catch (e) {
      console.warn('[Keurzen] Onboarding save error:', e);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      if (user) await markOnboardingSeen(user.id);
      if (profile) setProfile({ ...profile, has_seen_onboarding: true });
    } catch (e) {
      console.warn('[Keurzen] Onboarding skip error:', e);
    } finally {
      setLoading(false);
      router.replace('/dashboard');
    }
  }

  function handleDiscover() {
    router.replace('/dashboard');
  }

  // ── Completion screen ──

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div
          className="w-full text-center"
          style={{ maxWidth: 480 }}
        >
          <div className="mb-6 text-7xl">🏠</div>
          <h1
            className="mb-3 font-heading text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tout est pret !
          </h1>
          <p
            className="mb-8 text-base"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Keurzen est configure pour votre foyer. Bienvenue !
          </p>
          <button
            onClick={handleDiscover}
            className="w-full rounded-[var(--radius-lg)] py-3.5 text-base font-semibold transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: 'var(--color-terracotta)',
              color: 'var(--color-text-inverse)',
            }}
          >
            Decouvrir Keurzen
          </button>
        </div>
      </div>
    );
  }

  // ── Step screen ──

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full" style={{ maxWidth: 480 }}>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i <= step
                    ? 'var(--color-terracotta)'
                    : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Header row: back arrow + skip */}
        <div className="mb-6 flex items-center justify-between">
          <div className="w-8">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-border-light"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Etape precedente"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Passer
          </button>
        </div>

        {/* Question */}
        <h2
          className="mb-6 font-heading text-xl font-bold leading-snug"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {currentStep.question}
        </h2>

        {/* Options */}
        <div className="mb-8 space-y-3">
          {currentStep.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="flex w-full items-center gap-4 rounded-[var(--radius-lg)] px-4 py-3.5 text-left transition-all"
                style={{
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--color-terracotta) 8%, white)'
                    : 'var(--color-background-card)',
                  border: isSelected
                    ? '2px solid var(--color-terracotta)'
                    : '2px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span
                  className="flex-1 text-sm font-medium"
                  style={{
                    color: isSelected
                      ? 'var(--color-terracotta)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {option.label}
                </span>
                {isSelected && (
                  <CheckCircle
                    size={20}
                    style={{ color: 'var(--color-terracotta)', flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!selectedValue || loading}
          className="w-full rounded-[var(--radius-lg)] py-3.5 text-base font-semibold transition-opacity"
          style={{
            backgroundColor: selectedValue
              ? 'var(--color-terracotta)'
              : 'var(--color-border)',
            color: selectedValue
              ? 'var(--color-text-inverse)'
              : 'var(--color-text-muted)',
            cursor: selectedValue ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? 'Chargement...'
            : step < STEPS.length - 1
            ? 'Continuer'
            : 'Terminer'}
        </button>
      </div>
    </div>
  );
}
