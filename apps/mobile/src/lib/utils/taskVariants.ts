// apps/mobile/src/lib/utils/taskVariants.ts
import type { Task, TaskCategory, TaskPriority, RecurrenceType, TaskZone } from '../../types';

export interface TaskVariant {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  recurrence: RecurrenceType;
  estimatedMinutes: number | null;
  description: string | null;
  zone: TaskZone;
  count: number;
}

function variantKey(t: { title: string; category: string; priority: string; recurrence: string; estimated_minutes: number | null }): string {
  return `${t.title.toLowerCase()}|${t.category}|${t.priority}|${t.recurrence}|${t.estimated_minutes ?? ''}`;
}

export function buildTaskVariants(tasks: Task[]): TaskVariant[] {
  const map = new Map<string, TaskVariant>();

  for (const t of tasks) {
    const key = variantKey(t);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        title: t.title,
        category: t.category,
        priority: t.priority,
        recurrence: t.recurrence,
        estimatedMinutes: t.estimated_minutes,
        description: t.description,
        zone: t.zone,
        count: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function filterVariants(variants: TaskVariant[], query: string, maxResults = 5): TaskVariant[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return variants
    // Exclude exact title matches — don't suggest what's already typed
    .filter((v) => v.title.toLowerCase().includes(q) && v.title.toLowerCase() !== q)
    .slice(0, maxResults);
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdo',
  biweekly: 'Bi-hebdo',
  monthly: 'Mensuel',
};

// medium is intentionally omitted — it's the default priority
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Faible',
  high: 'Haute',
  urgent: 'Urgente',
};

export function formatVariantSubtitle(v: TaskVariant, categoryLabels: Record<string, { label: string }>): string {
  const parts: string[] = [];

  if (v.recurrence !== 'none' && RECURRENCE_LABELS[v.recurrence]) {
    parts.push(RECURRENCE_LABELS[v.recurrence]);
  }

  if (v.estimatedMinutes != null) {
    if (v.estimatedMinutes >= 60) {
      const h = Math.floor(v.estimatedMinutes / 60);
      const m = v.estimatedMinutes % 60;
      parts.push(m > 0 ? `${h}h${m}` : `${h}h`);
    } else {
      parts.push(`${v.estimatedMinutes}min`);
    }
  }

  if (PRIORITY_LABELS[v.priority]) {
    parts.push(PRIORITY_LABELS[v.priority]);
  }

  if (parts.length === 0) {
    return categoryLabels[v.category]?.label ?? v.category;
  }

  return parts.join(' \u00B7 ');
}
