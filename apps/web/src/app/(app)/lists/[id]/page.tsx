'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import {
  useListById,
  useListItems,
  useAddListItem,
  useToggleListItem,
  useDeleteListItem,
  useDeleteList,
} from '@keurzen/queries';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: list } = useListById(id);
  const { data: items = [] } = useListItems(id);
  const { mutate: addItem, isPending: isAdding } = useAddListItem();
  const { mutate: toggleItem } = useToggleListItem();
  const { mutate: deleteItem } = useDeleteListItem();
  const { mutate: deleteList } = useDeleteList();
  const [newItemTitle, setNewItemTitle] = useState('');

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    addItem({ listId: id, values: { title: newItemTitle.trim() } });
    setNewItemTitle('');
  };

  const handleDeleteList = () => {
    if (confirm('Supprimer cette liste et tous ses elements ?')) {
      deleteList(id);
      router.push('/lists');
    }
  };

  if (!list) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/lists')}
          className="mb-3 flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Retour aux listes
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-[32px] font-bold">{list.title}</h1>
          <Button variant="destructive" size="sm" onClick={handleDeleteList}>
            <Trash2 size={14} />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Items */}
      <Card className="mb-4">
        {items.length > 0 ? (
          <div className="divide-y divide-border-light">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <button
                  onClick={() =>
                    toggleItem({ itemId: item.id, listId: id, checked: !item.checked })
                  }
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                    item.checked
                      ? 'border-sauge bg-sauge text-white'
                      : 'border-border hover:border-terracotta',
                  )}
                >
                  {item.checked && <Check size={12} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', item.checked && 'text-text-muted line-through')}>
                    {item.title}
                  </p>
                  {item.quantity && <p className="text-xs text-text-muted">{item.quantity}</p>}
                </div>
                <button
                  onClick={() => deleteItem({ itemId: item.id, listId: id })}
                  className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-rose/10 hover:text-rose"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">
            Aucun element — ajoutez-en un ci-dessous
          </p>
        )}
      </Card>

      {/* Add Item */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ajouter un element..."
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          className="h-11 flex-1 rounded-[var(--radius-md)] border border-border bg-background-card px-4 text-sm placeholder:text-text-muted focus:border-terracotta focus:outline-none"
        />
        <Button onClick={handleAddItem} isLoading={isAdding}>
          <Plus size={16} />
          Ajouter
        </Button>
      </div>
    </>
  );
}
