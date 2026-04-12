import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-3 w-3 rounded-full bg-terracotta" />
        <h1 className="font-heading text-4xl font-bold text-text-primary">
          Keurzen
        </h1>
        <p className="mt-2 text-text-secondary">
          Gestion de foyer premium
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-8 text-sm font-semibold text-text-inverse shadow-sm transition-colors hover:bg-terracotta/90"
          >
            Se connecter
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-terracotta"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
