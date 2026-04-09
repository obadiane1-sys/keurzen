/**
 * Household Score — score composite du foyer
 *
 * 4 dimensions pondérées :
 * - Complétion (35%) : tâches terminées / total
 * - Équilibre (30%) : écart max de répartition entre membres
 * - TLX (25%) : charge mentale moyenne inversée
 * - Streak (10%) : jours consécutifs avec au moins 1 tâche complétée
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScoreDimension {
  label: string;
  value: number; // 0–100
  weight: number;
}

export interface HouseholdScoreResult {
  total: number; // 0–100
  dimensions: {
    completion: ScoreDimension;
    balance: ScoreDimension;
    tlx: ScoreDimension;
    streak: ScoreDimension;
  };
}

export interface HouseholdScoreInput {
  /** Number of completed tasks this week */
  completedTasks: number;
  /** Total tasks this week */
  totalTasks: number;
  /** Max absolute tasks_delta among members (0–1 scale) */
  maxImbalance: number;
  /** Average TLX score across household members (0–100) */
  averageTlx: number;
  /** Consecutive days with at least 1 completed task */
  streakDays: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WEIGHTS = {
  completion: 0.35,
  balance: 0.30,
  tlx: 0.25,
  streak: 0.10,
} as const;

/** Streak cap — beyond this, score maxes out */
const STREAK_CAP = 7;

// ─── Computation ─────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(Math.max(v, min), max);
}

export function computeHouseholdScore(input: HouseholdScoreInput): HouseholdScoreResult {
  const { completedTasks, totalTasks, maxImbalance, averageTlx, streakDays } = input;

  // 1. Complétion: done / total (100 if no tasks)
  const completionValue = totalTasks > 0
    ? clamp(Math.round((completedTasks / totalTasks) * 100))
    : 100;

  // 2. Équilibre: inverse of max imbalance (0 = perfect, 0.5+ = worst)
  //    Map [0, 0.5] → [100, 0]
  const balanceValue = clamp(Math.round((1 - Math.min(maxImbalance, 0.5) * 2) * 100));

  // 3. TLX: inversé — high TLX = bad → low score
  const tlxValue = clamp(Math.round(100 - averageTlx));

  // 4. Streak: linear up to STREAK_CAP days
  const streakValue = clamp(Math.round((Math.min(streakDays, STREAK_CAP) / STREAK_CAP) * 100));

  const dimensions = {
    completion: { label: 'Completion', value: completionValue, weight: WEIGHTS.completion },
    balance: { label: 'Equilibre', value: balanceValue, weight: WEIGHTS.balance },
    tlx: { label: 'Charge mentale', value: tlxValue, weight: WEIGHTS.tlx },
    streak: { label: 'Regularite', value: streakValue, weight: WEIGHTS.streak },
  };

  const total = Math.round(
    Object.values(dimensions).reduce((sum, d) => sum + d.value * d.weight, 0),
  );

  return { total: clamp(total), dimensions };
}
