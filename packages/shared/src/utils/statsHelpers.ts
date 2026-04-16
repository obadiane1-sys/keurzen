import dayjs from 'dayjs';

export type CoachLevel = 'balanced' | 'watch' | 'unbalanced' | 'low-activity';

type StreakTask = {
  completed_at: string | null;
  assigned_to: string | null;
  status: string;
};

export function computeStreakDays(
  tasks: StreakTask[],
  userId: string,
  today: Date
): number {
  const doneDays = new Set<string>();
  for (const t of tasks) {
    if (t.assigned_to !== userId) continue;
    if (t.status !== 'done') continue;
    if (!t.completed_at) continue;
    doneDays.add(dayjs(t.completed_at).format('YYYY-MM-DD'));
  }

  let streak = 0;
  let cursor = dayjs(today);
  while (doneDays.has(cursor.format('YYYY-MM-DD'))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

type EfficiencyTask = {
  completed_at: string | null;
  due_date: string | null;
  status: string;
  assigned_to: string | null;
};

export function computeEfficiency(
  tasks: EfficiencyTask[],
  userId: string,
  periodStart: Date,
  periodEnd: Date
): number {
  const start = dayjs(periodStart);
  const end = dayjs(periodEnd);
  const mine = tasks.filter((t) => {
    if (t.assigned_to !== userId) return false;
    if (t.status !== 'done') return false;
    if (!t.completed_at) return false;
    const c = dayjs(t.completed_at);
    return (c.isSame(start) || c.isAfter(start)) && (c.isSame(end) || c.isBefore(end));
  });
  if (mine.length === 0) return 0;

  const onTime = mine.filter((t) => {
    if (!t.due_date) return true;
    return dayjs(t.completed_at!).isSame(dayjs(t.due_date), 'day')
      || dayjs(t.completed_at!).isBefore(dayjs(t.due_date).endOf('day'));
  });

  return Math.round((onTime.length / mine.length) * 100);
}

const COACH_MESSAGES: Record<CoachLevel, string> = {
  balanced: 'Un equilibre remarquable cette semaine.',
  watch: 'Attention, la balance commence a pencher.',
  unbalanced: 'La charge est desequilibree — il est temps d\'en parler.',
  'low-activity': 'Peu d\'activite cette periode — donnez-vous un nouvel elan.',
};

export function pickCoachMessage(level: CoachLevel): string {
  return COACH_MESSAGES[level];
}

export function computeScoreDelta(
  currentScore: number,
  previousScore: number
): number {
  if (previousScore === 0) return 0;
  return Math.round(((currentScore - previousScore) / previousScore) * 100);
}

export type BalanceLevel = 'balanced' | 'watch' | 'unbalanced';

export interface BalanceLevelLabel {
  text: string;
  color: string;
}

export function labelForBalanceLevel(level: BalanceLevel): BalanceLevelLabel {
  switch (level) {
    case 'unbalanced':
      return { text: 'Charge elevee', color: '#E07A5F' };
    case 'watch':
      return { text: 'A surveiller', color: '#F4A261' };
    default:
      return { text: 'Equilibre ideal', color: '#967BB6' };
  }
}

export function getDeltaColor(delta: number): string {
  return delta >= 0 ? '#81C784' : '#E07A5F';
}
