import { Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  userName?: string;
  avatarUrl?: string | null;
  unreadCount?: number;
}

export function PageHeader({ title, subtitle, actions, userName, avatarUrl, unreadCount = 0 }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative rounded-[var(--radius-sm)] p-2 text-text-primary hover:bg-border-light transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-text-inverse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <Avatar src={avatarUrl} name={userName} size={36} />
      </div>
    </div>
  );
}
