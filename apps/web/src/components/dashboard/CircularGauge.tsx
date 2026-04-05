interface CircularGaugeProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  label: string;
  subtitle?: string;
}

export function CircularGauge({
  value,
  max,
  color,
  size = 80,
  label,
  subtitle,
}: CircularGaugeProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const progress = max > 0 ? clampedValue / max : 0;
  const degrees = Math.round(progress * 360);
  const displayValue = max === 100 ? value : `${Math.round(progress * 100)}%`;
  const innerSize = size * 0.8;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} 0deg ${degrees}deg, var(--color-gray-100) ${degrees}deg 360deg)`,
        }}
      >
        <div
          className="rounded-full bg-background-card flex flex-col items-center justify-center"
          style={{ width: innerSize, height: innerSize }}
        >
          <span
            className="font-heading font-extrabold leading-none"
            style={{ color, fontSize: size * 0.275 }}
          >
            {displayValue}
          </span>
          {subtitle && (
            <span
              className="text-text-muted"
              style={{ fontSize: size * 0.11 }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-text-secondary">
        {label}
      </span>
    </div>
  );
}
