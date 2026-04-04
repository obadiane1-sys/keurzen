'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, List as ListIcon, ShoppingCart, ClipboardList } from 'lucide-react';
import { useLists, useCreateList } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { SharedListType } from '@keurzen/shared';

const typeIcons: Record<SharedListType, typeof ListIcon> = {
  shopping: ShoppingCart,
  todo: ClipboardList,
  custom: ListIcon,
};

export default function ListsPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: lists = [], isLoading } = useLists();
  const { mutateAsync: createList, isPending } = useCreateList();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SharedListType>('shopping');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const list = await createList({ title: newTitle.trim(), type: newType });
    setNewTitle('');
    setShowCreate(false);
    router.push(`/lists/${list.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Listes"
        userName={profile?.full_name || undefined}
        avatarUrl={profile?.avatar_url}
        actions={
          <Button size="md" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Creer
          </Button>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          icon={ListIcon}
          title="Aucune liste"
          subtitle="Creez une liste pour organiser vos courses ou taches"
          action={{ label: 'Creer une liste', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {lists.map((list) => {
            const Icon = typeIcons[list.type] || ListIcon;
            return (
              <Card
                key={list.id}
                hoverable
                onClick={() => router.push(`/lists/${list.id}`)}
                className="flex flex-col items-center gap-2 py-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-border-light">
                  <Icon size={22} className="text-terracotta" />
                </div>
                <h3 className="font-heading text-base font-semibold">{list.title}</h3>
                <p className="text-xs text-text-muted">
                  {list.item_count ?? 0} element{(list.item_count ?? 0) !== 1 ? 's' : ''}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle liste">
        <div className="space-y-4">
          <Input
            label="Nom de la liste"
            placeholder="Ex: Courses de la semaine"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <div>
            <label className="text-[13px] font-medium text-text-secondary">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SharedListType)}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-border bg-background-card px-3 text-sm focus:border-terracotta focus:outline-none"
            >
              <option value="shopping">Courses</option>
              <option value="todo">A faire</option>
              <option value="custom">Personnalisee</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} isLoading={isPending}>
              Creer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
