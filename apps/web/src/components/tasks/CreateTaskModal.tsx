'use client';

import { useForm } from 'react-hook-form';
import { useCreateTask } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { TaskFormValues } from '@keurzen/shared';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const { mutateAsync: createTask, isPending } = useCreateTask();
  const { members } = useHouseholdStore();

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
        <Input
          label="Titre"
          placeholder="Ex: Faire les courses"
          {...register('title', { required: 'Le titre est requis' })}
          error={errors.title?.message}
          autoFocus
        />

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
