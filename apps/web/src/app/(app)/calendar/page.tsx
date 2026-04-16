'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useTasks } from '@keurzen/queries';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { Task } from '@keurzen/shared';

dayjs.locale('fr');

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendarPage() {
  const { profile } = useAuthStore();
  const { members } = useHouseholdStore();
  const { data: tasks = [], isLoading } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map: date string -> tasks
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Get member color for a user
  const getMemberColor = (userId: string | null): string => {
    if (!userId) return 'var(--color-text-muted)';
    const member = members.find((m) => m.user_id === userId);
    return member?.color || 'var(--color-text-muted)';
  };

  // Build calendar grid
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1; // Monday = 0
  const daysInMonth = endOfMonth.date();
  const today = dayjs().format('YYYY-MM-DD');

  const cells: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];
  // Leading empty days from previous month
  for (let i = 0; i < startDay; i++) {
    const d = startOfMonth.subtract(startDay - i, 'day');
    cells.push({ date: d.format('YYYY-MM-DD'), dayNum: d.date(), isCurrentMonth: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = currentMonth.date(d).format('YYYY-MM-DD');
    cells.push({ date, dayNum: d, isCurrentMonth: true });
  }
  // Trailing days to fill grid
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = endOfMonth.add(i, 'day');
      cells.push({ date: d.format('YYYY-MM-DD'), dayNum: d.date(), isCurrentMonth: false });
    }
  }

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        userName={profile?.full_name || undefined}
        avatarUrl={profile?.avatar_url}
      />

      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
          className="rounded-[var(--radius-sm)] p-2 hover:bg-border-light transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-heading text-lg font-semibold capitalize">
          {currentMonth.format('MMMM YYYY')}
        </h2>
        <button
          onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
          className="rounded-[var(--radius-sm)] p-2 hover:bg-border-light transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar Grid */}
      <Card className="mb-4 p-0 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 border-b border-border-light">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map(({ date, dayNum, isCurrentMonth }) => {
            const dayTasks = tasksByDate[date] || [];
            const isToday = date === today;
            const isSelected = date === selectedDate;

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-3 border-b border-r border-border-light/50 transition-colors min-h-[72px]',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'bg-primary/5',
                  isCurrentMonth && !isSelected && 'hover:bg-border-light/30',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                    isToday && 'bg-primary text-text-inverse font-semibold',
                  )}
                >
                  {dayNum}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getMemberColor(t.assigned_to) }}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="ml-0.5 text-[8px] text-text-muted">
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Task List */}
      {selectedDate && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {dayjs(selectedDate).format('dddd D MMMM')}
          </p>
          {selectedTasks.length > 0 ? (
            <Card>
              <div className="divide-y divide-border-light">
                {selectedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: getMemberColor(t.assigned_to) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-text-muted">
                        {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        t.status === 'done'
                          ? 'bg-success/15 text-success'
                          : 'bg-border-light text-text-muted',
                      )}
                    >
                      {t.status === 'done' ? 'Fait' : t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="py-4 text-center text-sm text-text-muted">Rien de prevu</p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
