import type { ReactNode } from 'react';
import Link from 'next/link';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-white/60 backdrop-blur px-4 py-6">
        <div className="font-semibold mb-4">Pro-Educ Admin</div>
        <nav className="space-y-2 text-sm">
          <Link className="block hover:underline" href="/proeduc">Dashboard</Link>
          <Link className="block hover:underline" href="/proeduc/groups">Grupos</Link>
          <Link className="block hover:underline" href="/proeduc/schools">Escolas</Link>
          <Link className="block hover:underline" href="/proeduc/admins">Admins</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}