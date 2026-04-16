'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useUpdateTask, useDeleteTask } from '@keurzen/queries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Task } from '@keurzen/shared';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const priorityVariants: Record<string, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger',
};

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const [title, setTitle] = useState(task.title);

  // Sync title when task changes
  useEffect(() => {
    setTitle(task.title); // eslint-disable-line react-hooks/set-state-in-effect
  }, [task.id, task.title]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask({ id: task.id, updates: { title: title.trim() } });
    }
  };

  const handleDelete = () => {
    if (confirm('Supprimer cette tache ?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background-card p-5 shadow-card">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <Badge variant={priorityVariants[task.priority] || 'warning'}>
          {priorityLabels[task.priority] || 'Moyenne'}
        </Badge>
        <button
          onClick={onClose}
          className="rounded-[var(--radius-sm)] p-1 text-text-muted hover:bg-border-light hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>

      {/* Title — editable */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="mb-3 w-full bg-transparent font-heading text-xl font-semibold text-text-primary focus:outline-none"
      />

      {/* Description */}
      {task.description && (
        <p className="mb-4 text-sm text-text-secondary leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Fields */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Assignee</span>
          <span className="font-medium">
            {task.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
          </span>
        </div>
        {task.due_date && (
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Echeance</span>
            <span className="font-medium">{task.due_date}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Categorie</span>
          <span className="font-medium capitalize">{task.category}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Recurrence</span>
          <span className="font-medium capitalize">
            {task.recurrence === 'none' ? 'Aucune' : task.recurrence}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Type</span>
          <Badge variant={task.task_type === 'personal' ? 'info' : 'default'}>
            {task.task_type === 'personal' ? 'Personnel' : 'Foyer'}
          </Badge>
        </div>
      </div>

      {/* Delete */}
      <div className="mt-6 pt-4 border-t border-border-light">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 size={14} />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
