import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

export function StatCard({ label, value, icon: Icon, color, onClick }: StatCardProps) {
  return (
    <Card hoverable={!!onClick} onClick={onClick} className="flex flex-col items-center gap-1.5 py-4">
      <Icon size={20} style={{ color }} />
      <span className="font-heading text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </Card>
  );
}
