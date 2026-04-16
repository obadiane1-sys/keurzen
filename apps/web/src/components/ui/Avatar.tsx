import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initials = name?.charAt(0).toUpperCase() || 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary text-text-inverse font-semibold',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
