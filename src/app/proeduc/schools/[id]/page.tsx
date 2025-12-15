'use client';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Schools } from '@/lib/proeduc/api';
import { useEffect, useState } from 'react';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const { data: school } = useSWR(!isNew ? ['school', id] : null, () => Schools.get(id as string));

  const [name, setName] = useState(school?.name || '');
  const [asaasToken, setAsaasToken] = useState(school?.asaasToken || '');
  const [asaasSandboxMode, setSandbox] = useState(!!school?.asaasSandboxMode);
  const [certInfo, setCertInfo] = useState(school?.certInfo || '');

  useEffect(() => {
    setName(school?.name || '');
    setAsaasToken(school?.asaasToken || '');
    setSandbox(!!school?.asaasSandboxMode);
    setCertInfo(school?.certInfo || '');
  }, [school]);

  async function onSave() {
    await Schools.upsert({
      id: isNew ? undefined : (id as string),
      name,
      asaasToken,
      asaasSandboxMode,
      certInfo,
    });
    router.push('/proeduc/schools');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? 'Nova Escola' : 'Editar Escola'}</h1>
        <div className="space-x-2">
          <button onClick={() => router.back()} className="px-3 py-2 rounded-md border">
            Voltar
          </button>
          <button onClick={onSave} className="px-3 py-2 rounded-md border bg-black text-white">
            Salvar
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Field label="Nome">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="ASAAS Token">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={asaasToken}
            onChange={(e) => setAsaasToken(e.target.value)}
          />
        </Field>
        <Field label="Sandbox Mode">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={asaasSandboxMode}
              onChange={(e) => setSandbox(e.target.checked)}
            />
            <span>Ativo</span>
          </label>
        </Field>
        <Field label="Informações de Certificado">
          <textarea
            className="w-full border rounded-md px-3 py-2 min-h-28"
            value={certInfo}
            onChange={(e) => setCertInfo(e.target.value)}
          />
        </Field>
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
