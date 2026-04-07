import type { OnboardingPreferences, HouseholdType, CurrentSplit, PainPoint, MainGoal } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

export interface OnboardingAnswers {
  household_type: HouseholdType;
  current_split: CurrentSplit;
  pain_point: PainPoint;
  main_goal: MainGoal;
}

export async function saveOnboardingPreferences(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('onboarding_preferences')
    .upsert(
      {
        user_id: userId,
        ...answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(error.message);
}

export async function fetchOnboardingPreferences(
  userId: string
): Promise<OnboardingPreferences | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('onboarding_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as OnboardingPreferences;
}
