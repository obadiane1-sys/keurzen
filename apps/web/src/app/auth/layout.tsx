export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[440px] space-y-6 rounded-[var(--radius-xl)] bg-background-card p-8 shadow-lg">
        {/* Brand header */}
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="font-heading text-sm font-semibold tracking-wider text-text-primary">
            Keurzen
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
