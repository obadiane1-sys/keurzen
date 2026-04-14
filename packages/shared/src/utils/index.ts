import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

export function formatDate(date: string, format = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format);
}

export function getCurrentWeekStart(): string {
  return dayjs().startOf('isoWeek').format('YYYY-MM-DD');
}

export function getPreviousWeekStart(): string {
  return dayjs().startOf('isoWeek').subtract(1, 'week').format('YYYY-MM-DD');
}

export function mapPriority(p: string): 'high' | 'medium' | 'low' {
  if (p === 'high' || p === 'urgent') return 'high';
  if (p === 'low') return 'low';
  return 'medium';
}

export function computeTlxScore(values: {
  mental_demand: number;
  physical_demand: number;
  temporal_demand: number;
  performance: number;
  effort: number;
  frustration: number;
}): number {
  const invertedPerformance = 100 - values.performance;
  const sum =
    values.mental_demand +
    values.physical_demand +
    values.temporal_demand +
    invertedPerformance +
    values.effort +
    values.frustration;
  return Math.round(sum / 6);
}

export { categoryColorMap } from './taskCategoryColors';
export { computeHouseholdScore } from './householdScore';
export type { HouseholdScoreInput, HouseholdScoreResult, ScoreDimension } from './householdScore';
export { computeWeeklyAggregation, computeImbalanceLevel, computeAverageTlx, IMBALANCE_THRESHOLD, MIN_TASKS_SAMPLE, MIN_MINUTES_SAMPLE } from './weeklyStats';
export type { MemberTaskData, MemberWeeklyStats, WeeklyAggregation } from './weeklyStats';

export {
  computeStreakDays,
  computeEfficiency,
  pickCoachMessage,
  computeScoreDelta,
} from './statsHelpers';
export type { CoachLevel } from './statsHelpers';
