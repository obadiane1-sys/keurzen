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
  const map = new Map<string, { variant: TaskVariant; count: number }>();

  for (const t of tasks) {
    const key = variantKey(t);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.variant.count = existing.count;
    } else {
      map.set(key, {
        count: 1,
        variant: {
          title: t.title,
          category: t.category,
          priority: t.priority,
          recurrence: t.recurrence,
          estimatedMinutes: t.estimated_minutes,
          description: t.description,
          zone: t.zone,
          count: 1,
        },
      });
    }
  }

  return Array.from(map.values())
    .map((entry) => entry.variant)
    .sort((a, b) => b.count - a.count);
}

export function filterVariants(variants: TaskVariant[], query: string, maxResults = 5): TaskVariant[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return variants
    .filter((v) => v.title.toLowerCase().includes(q) && v.title.toLowerCase() !== q)
    .slice(0, maxResults);
}

export function formatVariantSubtitle(v: TaskVariant, categoryLabels: Record<string, { label: string }>): string {
  const parts: string[] = [];

  const recurrenceLabels: Record<string, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdo',
    biweekly: 'Bi-hebdo',
    monthly: 'Mensuel',
  };
  if (v.recurrence !== 'none' && recurrenceLabels[v.recurrence]) {
    parts.push(recurrenceLabels[v.recurrence]);
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

  const priorityLabels: Record<string, string> = { low: 'Faible', high: 'Haute', urgent: 'Urgente' };
  if (priorityLabels[v.priority]) {
    parts.push(priorityLabels[v.priority]);
  }

  if (parts.length === 0) {
    return categoryLabels[v.category]?.label ?? v.category;
  }

  return parts.join(' \u00B7 ');
}
