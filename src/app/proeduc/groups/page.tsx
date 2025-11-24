'use client';
import useSWR from 'swr';
import { Groups } from '@/src/lib/proeduc/api';
import Link from 'next/link';

export default function Page() {
  const { data: groups } = useSWR('groups', Groups.list);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Grupos</h1>
        <Link href="/proeduc/groups/new" className="px-3 py-2 rounded-md border">Novo Grupo</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {groups?.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="py-2 pr-4">{g.name}</td>
                <td className="py-2">
                  <Link className="underline" href={`/proeduc/groups/${g.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
            {!groups?.length && (
              <tr><td className="py-6 text-center text-neutral-500" colSpan={2}>Nenhum grupo</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}