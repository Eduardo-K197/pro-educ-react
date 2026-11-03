'use client';

import { useState, useEffect, useCallback } from 'react';

import { ApiService } from 'src/services/api/api';

import { toast } from 'src/components/snackbar';

type Job = { jobId?: string; active?: boolean; processing?: boolean; completed?: boolean; failed?: boolean };

// Only reads job state; never creates, retries or downloads a bank charge.
export function useCoraInstallmentJob(studentId: number, onCompleted: () => void) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setJobId(null); setMessage(''); setChecking(true); setCheckFailed(false);
    ApiService.get<Job>('/payments/cora-jobs/active', { studentId }).then((job) => {
      if (active && job.active && job.jobId) {
        setJobId(job.jobId); setMessage('Carnê em processamento. Aguarde antes de gerar outra cobrança.');
      }
    }).catch(() => { if (active) setCheckFailed(true); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [studentId, refresh]);

  useEffect(() => {
    if (!jobId) return undefined;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const job = await ApiService.get<Job>(`/payments/cora-jobs/${jobId}`);
        if (!active) return;
        if (job.completed) {
          setJobId(null); setMessage('Carnê pronto. A lista de pagamentos foi atualizada.');
          toast.success('Carnê pronto!'); onCompleted(); return;
        }
        if (job.failed) {
          setMessage('O banco não concluiu o carnê. Confira as parcelas já criadas antes de tentar novamente.');
          onCompleted(); return;
        }
        setMessage('Carnê em processamento. A lista será atualizada ao concluir.');
      } catch {
        if (!active) return;
        setMessage('Não foi possível consultar o andamento. Não gere outra cobrança; atualize a ficha para conferir.');
      }
      if (active && attempts < 60) timer = setTimeout(poll, 10000);
      else if (active) setMessage('O processamento continua no banco. Atualize a ficha para conferir antes de gerar outra cobrança.');
    };
    timer = setTimeout(poll, 10000);
    return () => { active = false; clearTimeout(timer); };
  }, [jobId, onCompleted]);

  const start = useCallback((id: string) => {
    setJobId(id); setMessage('Carnê em processamento. Não envie novamente; aguarde a conclusão.');
  }, []);
  return { start, checking, blocked: checking || checkFailed || !!jobId, message,
    checkFailed, retry: () => setRefresh((value) => value + 1) };
}
