'use client';
import useSWR from 'swr';
import { Admins } from '@/src/lib/proeduc/api';
import Link from 'next/link';

export default function Page() {
  const { data: admins } = useSWR('admins', Admins.list);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admins</h1>
        <Link href="/proeduc/admins/new" className="px-3 py-2 rounded-md border">Novo Admin</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {admins?.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="py-2 pr-4">{a.email}</td>
                <td className="py-2 pr-4">{a.name || '—'}</td>
                <td className="py-2 space-x-3">
                  <Link className="underline" href={`/proeduc/admins/${a.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
            {!admins?.length && (
              <tr><td className="py-6 text-center text-neutral-500" colSpan={3}>Sem admins</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}