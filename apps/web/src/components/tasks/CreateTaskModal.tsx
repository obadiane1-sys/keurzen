'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTask, useTasks } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TaskSuggestions } from './TaskSuggestions';
import { buildTaskVariants, filterVariants } from '@/lib/utils/taskVariants';
import type { TaskVariant } from '@/lib/utils/taskVariants';
import type { TaskFormValues } from '@keurzen/shared';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const { mutateAsync: createTask, isPending } = useCreateTask();
  const { members } = useHouseholdStore();

  const { data: existingTasks = [] } = useTasks();
  const [titleQuery, setTitleQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allVariants = useMemo(
    () => buildTaskVariants(existingTasks),
    [existingTasks],
  );

  const filteredVariants = useMemo(
    () => filterVariants(allVariants, titleQuery),
    [allVariants, titleQuery],
  );

  const handleVariantSelect = (variant: TaskVariant) => {
    reset({
      title: variant.title,
      description: variant.description ?? '',
      priority: variant.priority as TaskFormValues['priority'],
      category: variant.category as TaskFormValues['category'],
      zone: variant.zone as TaskFormValues['zone'],
      recurrence: variant.recurrence as TaskFormValues['recurrence'],
      estimated_minutes: variant.estimatedMinutes ?? undefined,
      task_type: 'household',
    });
    setTitleQuery(variant.title);
    setShowSuggestions(false);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category: 'other',
      zone: 'general',
      recurrence: 'none',
      task_type: 'household',
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    await createTask(values);
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle tache">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Input
            label="Titre"
            placeholder="Ex: Faire les courses"
            {...register('title', { required: 'Le titre est requis' })}
            error={errors.title?.message}
            autoFocus
            onChange={(e) => {
              register('title').onChange(e);
              setTitleQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          <TaskSuggestions
            query={titleQuery}
            variants={filteredVariants}
            visible={showSuggestions}
            onSelect={handleVariantSelect}
          />
        </div>

        <div>
          <label className="text-[13px] font-medium text-text-secondary">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Details optionnels..."
            rows={3}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-background-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-terracotta focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-medium text-text-secondary">
              Priorite
            </label>
            <select
              {...register('priority')}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-border bg-background-card px-3 text-sm focus:border-terracotta focus:outline-none"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-medium text-text-secondary">
              Echeance
            </label>
            <input
              type="date"
              {...register('due_date')}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-border bg-background-card px-3 text-sm focus:border-terracotta focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[13px] font-medium text-text-secondary">
            Assigner a
          </label>
          <select
            {...register('assigned_to')}
            className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-border bg-background-card px-3 text-sm focus:border-terracotta focus:outline-none"
          >
            <option value="">Non assigne</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profile?.full_name || 'Membre'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isPending}>
            Creer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
