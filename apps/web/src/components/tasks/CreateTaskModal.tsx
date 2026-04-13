'use client';

import { useState, useCallback } from 'react';
import { useCreateTask } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import { Modal } from '@/components/ui/Modal';
import type { TaskFormValues, TaskCategory, TaskPriority, RecurrenceType, TaskType } from '@keurzen/shared';

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: 'cleaning', label: 'Ménage', emoji: '🧹' },
  { value: 'cooking', label: 'Cuisine', emoji: '🍳' },
  { value: 'shopping', label: 'Courses', emoji: '🛒' },
  { value: 'admin', label: 'Admin', emoji: '📋' },
  { value: 'children', label: 'Enfants', emoji: '👶' },
  { value: 'pets', label: 'Animaux', emoji: '🐾' },
  { value: 'garden', label: 'Jardin', emoji: '🌿' },
  { value: 'repairs', label: 'Bricolage', emoji: '🔧' },
  { value: 'health', label: 'Santé', emoji: '💊' },
  { value: 'finances', label: 'Finances', emoji: '💰' },
  { value: 'other', label: 'Autre', emoji: '📦' },
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Jamais' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bimensuel' },
  { value: 'monthly', label: 'Mensuel' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const { mutateAsync: createTask, isPending } = useCreateTask();
  const { members } = useHouseholdStore();

  // Form state
  const [taskType, setTaskType] = useState<TaskType>('household');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('shopping');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [priority, setPriority] = useState(1); // 0=low, 1=medium, 2=high
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.value === category)!;
  const priorityValue: TaskPriority = priority === 0 ? 'low' : priority === 1 ? 'medium' : 'high';
  const isDisabled = !title.trim();

  const resetForm = useCallback(() => {
    setTaskType('household');
    setTitle('');
    setCategory('shopping');
    setAssignedTo(null);
    setDueDate('');
    setDueTime('10:00');
    setPriority(1);
    setRecurrence('none');
    setShowCategoryDropdown(false);
    setShowRecurrenceDropdown(false);
  }, []);

  const handleSubmit = async () => {
    if (isDisabled) return;

    const values: TaskFormValues = {
      title: title.trim(),
      category,
      zone: 'general',
      priority: priorityValue,
      recurrence,
      assigned_to: assignedTo ?? '',
      due_date: dueDate || undefined,
      task_type: taskType,
    };

    await createTask(values);
    resetForm();
    onClose();
  };

  const getInitial = (name?: string | null) => {
    if (!name) return '?';
    return name.trim()[0]?.toUpperCase() ?? '?';
  };

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Nouvelle tâche">
      <div className="space-y-6">
        {/* ─── Task Type Toggle ─────────────────────────────────────────── */}
        <div className="flex rounded-xl bg-primary-surface p-1">
          <button
            type="button"
            className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition-all ${
              taskType === 'household'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted'
            }`}
            onClick={() => setTaskType('household')}
          >
            🏠 Ménage
          </button>
          <button
            type="button"
            className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition-all ${
              taskType === 'personal'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted'
            }`}
            onClick={() => setTaskType('personal')}
          >
            👤 Perso
          </button>
        </div>

        {/* ─── Nom ──────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Nom
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-border bg-primary-surface/30 px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            placeholder="Ex : Courses, Ménage salon..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* ─── Catégorie ────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Catégorie
          </label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border bg-primary-surface/30 px-4 py-3.5 text-sm hover:border-primary transition-all"
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowRecurrenceDropdown(false);
              }}
            >
              <span>{selectedCategory.emoji} {selectedCategory.label}</span>
              <svg className={`h-5 w-5 text-primary transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategoryDropdown && (
              <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-white shadow-md">
                {CATEGORIES.map(cat => {
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      className={`flex w-full items-center justify-between border-b border-primary-surface/50 px-4 py-3 text-left text-sm transition-colors hover:bg-primary-surface ${
                        active ? 'bg-primary-surface/50 font-medium text-primary' : ''
                      }`}
                      onClick={() => {
                        setCategory(cat.value);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <span>{cat.emoji} {cat.label}</span>
                      {active && (
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Assigné à ────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Assigné à
          </label>
          <div className="flex gap-2">
            {members.map(m => {
              const selected = assignedTo === m.user_id;
              const name = m.profile?.full_name?.split(' ')[0] ?? 'Membre';
              return (
                <button
                  key={m.user_id}
                  type="button"
                  className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold transition-all ${
                    selected
                      ? 'bg-primary-light text-text-primary'
                      : 'border border-border text-text-muted'
                  }`}
                  onClick={() => setAssignedTo(selected ? null : m.user_id)}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${
                    selected ? 'bg-white' : 'bg-primary-surface'
                  }`}>
                    {getInitial(m.profile?.full_name)}
                  </div>
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Échéance ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Échéance
          </label>
          <div className="flex overflow-hidden rounded-xl border border-border bg-primary-surface/30 hover:border-primary transition-all">
            <div className="flex flex-1 items-center gap-3 border-r border-border px-4 py-3.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                className="flex-1 bg-transparent text-sm font-medium text-text-primary focus:outline-none"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                type="time"
                className="bg-transparent text-sm font-medium text-text-primary focus:outline-none"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                step="300"
              />
            </div>
          </div>
        </div>

        {/* ─── Priorité ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Priorité
          </label>
          <div className="px-2 pt-2">
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="priority-slider w-full"
            />
            <div className="mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-tight">
              <span className={priority === 0 ? 'text-primary' : 'text-text-muted'}>Basse</span>
              <span className={priority === 1 ? 'text-primary' : 'text-text-muted'}>Moyenne</span>
              <span className={priority === 2 ? 'text-primary' : 'text-text-muted'}>Haute</span>
            </div>
          </div>
        </div>

        {/* ─── Répéter ──────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-primary/70">
            Répéter
          </label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-primary-surface/30 px-4 py-3.5 text-sm hover:border-primary transition-all"
              onClick={() => {
                setShowRecurrenceDropdown(!showRecurrenceDropdown);
                setShowCategoryDropdown(false);
              }}
            >
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="flex-1 text-left font-medium text-text-primary">
                {RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label}
              </span>
              <svg className={`h-4 w-4 text-text-muted transition-transform ${showRecurrenceDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRecurrenceDropdown && (
              <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-white shadow-md">
                {RECURRENCE_OPTIONS.map(opt => {
                  const active = recurrence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`flex w-full items-center justify-between border-b border-primary-surface/50 px-4 py-3 text-left text-sm transition-colors hover:bg-primary-surface ${
                        active ? 'bg-primary-surface/50 font-medium text-primary' : ''
                      }`}
                      onClick={() => {
                        setRecurrence(opt.value);
                        setShowRecurrenceDropdown(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {active && (
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Submit Button ────────────────────────────────────────────── */}
        <button
          type="button"
          className={`w-full rounded-xl bg-primary py-4 text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${
            isDisabled ? 'opacity-35 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          onClick={handleSubmit}
          disabled={isDisabled || isPending}
        >
          {isPending ? 'Création...' : 'Créer la tâche'}
        </button>
      </div>
    </Modal>
  );
}
