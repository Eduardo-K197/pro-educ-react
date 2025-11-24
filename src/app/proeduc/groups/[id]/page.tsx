'use client';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Groups, Schools, Admins } from '@/src/lib/proeduc/api';
import { useEffect, useState } from 'react';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const { data: group } = useSWR(!isNew ? ['group', id] : null, () => Groups.get(id as string));
  const { data: schools } = useSWR('schools', Schools.list);
  const { data: admins } = useSWR('admins', Admins.list);

  const [name, setName] = useState(group?.name || '');
  const [selSchools, setSelSchools] = useState<string[]>(group?.schools || []);
  const [selAdmins, setSelAdmins] = useState<string[]>(group?.admins || []);

  useEffect(() => {
    setName(group?.name || '');
    setSelSchools(group?.schools || []);
    setSelAdmins(group?.admins || []);
  }, [group]);

  async function onSave() {
    await Groups.upsert({
      id: isNew ? undefined : (id as string),
      name,
      schools: selSchools,
      admins: selAdmins,
    });
    router.push('/proeduc/groups');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? 'Novo Grupo' : 'Editar Grupo'}</h1>
        <div className="space-x-2">
          <button onClick={() => router.back()} className="px-3 py-2 rounded-md border">Voltar</button>
          <button onClick={onSave} className="px-3 py-2 rounded-md border bg-black text-white">Salvar</button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-3 rounded-xl border p-4">
          <label className="block text-sm mb-1">Nome</label>
          <input className="w-full border rounded-md px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div className="rounded-xl border p-4">
          <div className="font-medium mb-2">Escolas no grupo</div>
          <div className="max-h-80 overflow-auto space-y-2">
            {schools?.map(s => (
              <label className="flex items-center gap-2" key={s.id}>
                <input type="checkbox" checked={selSchools.includes(s.id)} onChange={(e)=>{
                  setSelSchools((prev)=> e.target.checked ? [...new Set([...prev, s.id])] : prev.filter(x=>x!==s.id));
                }} />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="font-medium mb-2">Admins no grupo</div>
          <div className="max-h-80 overflow-auto space-y-2">
            {admins?.map(a => (
              <label className="flex items-center gap-2" key={a.id}>
                <input type="checkbox" checked={selAdmins.includes(a.id)} onChange={(e)=>{
                  setSelAdmins((prev)=> e.target.checked ? [...new Set([...prev, a.id])] : prev.filter(x=>x!==a.id));
                }} />
                <span>{a.email}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}