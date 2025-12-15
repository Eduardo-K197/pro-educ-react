'use client';

import useSWR from 'swr';

import { Groups, Admins, Schools } from 'src/lib/proeduc/api';

export default function Page() {
  const { data: groups } = useSWR('groups', Groups.list);
  const { data: schools } = useSWR('schools', Schools.list);
  const { data: admins } = useSWR('admins', Admins.list);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Grupos" value={groups?.length} />
        <Card label="Escolas" value={schools?.length} />
        <Card label="Admins" value={admins?.length} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-3xl font-bold">{value ?? '—'}</div>
    </div>
  );
}
