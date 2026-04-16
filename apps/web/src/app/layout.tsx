import type { Metadata } from 'next';
import { Fredoka, Open_Sans, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-heading',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Keurzen',
  description: 'Gestion de foyer premium — equite, visibilite, charge mentale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn(fredoka.variable, openSans.variable, geist.variable, "font-sans")}>
      <body className="bg-background text-text-primary font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
