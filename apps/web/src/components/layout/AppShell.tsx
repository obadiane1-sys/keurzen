import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-[1080px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
