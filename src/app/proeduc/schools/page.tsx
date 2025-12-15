'use client';
import useSWR from 'swr';
import { Schools } from '@/lib/proeduc/api';
import Link from 'next/link';

export default function Page() {
  const { data: schools } = useSWR('schools', Schools.list);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Escolas</h1>
        <Link href="/proeduc/schools/new" className="px-3 py-2 rounded-md border">
          Nova Escola
        </Link>
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
            {schools?.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2 pr-4">{s.name}</td>
                <td className="py-2 space-x-3">
                  <Link className="underline" href={`/proeduc/schools/${s.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!schools?.length && (
              <tr>
                <td className="py-6 text-center text-neutral-500" colSpan={2}>
                  Sem escolas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
