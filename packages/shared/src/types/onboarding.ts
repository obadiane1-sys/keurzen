// ─── Onboarding Preferences ──────────────────────────────────────────────────

export type HouseholdType = 'solo' | 'couple' | 'family' | 'large_family';
export type CurrentSplit = 'mainly_me' | 'equal' | 'varies' | 'starting';
export type PainPoint = 'meals' | 'chores' | 'planning' | 'finances';
export type MainGoal = 'mental_relief' | 'overview' | 'balance' | 'save_time';

export interface OnboardingPreferences {
  id: string;
  user_id: string;
  household_type: HouseholdType | null;
  current_split: CurrentSplit | null;
  pain_point: PainPoint | null;
  main_goal: MainGoal | null;
  created_at: string;
  updated_at: string;
}
