'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Admins } from '@/src/lib/proeduc/api';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const { data: admins } = useSWR('admins', Admins.list);
  const admin = admins?.find((a) => a.id === id);

  const [email, setEmail] = useState(admin?.email || '');
  const [name, setName] = useState(admin?.name || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setEmail(admin?.email || '');
    setName(admin?.name || '');
  }, [admin]);

  async function onSave() {
    await Admins.upsert({
      id: isNew ? undefined : (id as string),
      email,
      name,
      ...(isNew && password ? { password } : {}),
    } as any);
    router.push('/proeduc/admins');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? 'Novo Admin' : 'Editar Admin'}</h1>
        <div className="space-x-2">
          <button onClick={() => router.back()} className="px-3 py-2 rounded-md border">Voltar</button>
          <button onClick={onSave} className="px-3 py-2 rounded-md border bg-black text-white">Salvar</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Field label="Email">
          <input className="w-full border rounded-md px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </Field>
        <Field label="Nome">
          <input className="w-full border rounded-md px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        </Field>
        {isNew && (
          <Field label="Senha (somente na criação)">
            <input type="password" className="w-full border rounded-md px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </Field>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-neutral-600 mb-1">{label}</div>
      {children}
    </div>
  );
}