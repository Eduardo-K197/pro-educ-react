import type { CrmCampaignStats, CrmCampaignStatus, CrmRecipientStatus } from 'src/types/services/crm-campaign';

export function campaignStatusColor(status: CrmCampaignStatus) {
  switch (status) {
    case 'running':
      return 'info' as const;
    case 'scheduled':
      return 'secondary' as const;
    case 'paused':
      return 'warning' as const;
    case 'completed':
      return 'success' as const;
    case 'canceled':
      return 'error' as const;
    default:
      return 'default' as const;
  }
}

export function recipientStatusColor(status: CrmRecipientStatus) {
  switch (status) {
    case 'failed':
      return 'error' as const;
    case 'skipped':
      return 'default' as const;
    case 'replied':
      return 'secondary' as const;
    case 'read':
      return 'success' as const;
    case 'delivered':
      return 'info' as const;
    case 'sent':
      return 'primary' as const;
    default:
      return 'warning' as const;
  }
}

/** Processados = tudo que já saiu da fila (enviado, falhou ou foi ignorado). */
export function campaignProgress(stats: CrmCampaignStats) {
  if (!stats.total) return 0;
  const done = stats.sent + stats.delivered + stats.read + stats.replied + stats.failed + stats.skipped;
  return Math.min(100, Math.round((done / stats.total) * 100));
}

/** Enviadas com sucesso (qualquer estágio após "sent"). */
export function campaignSent(stats: CrmCampaignStats) {
  return stats.sent + stats.delivered + stats.read + stats.replied;
}
