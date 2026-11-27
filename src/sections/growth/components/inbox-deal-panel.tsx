'use client';

import type { CrmConversation } from 'src/types/services/crm';
import type { CrmDeal, CrmDealSocketPayload } from 'src/types/services/crm-deal';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { isDeletedDeal, CRM_DEAL_STATUS_LABELS } from 'src/types/services/crm-deal';

import { daysSince, upsertDeal } from './crm-deal-utils';

// ----------------------------------------------------------------------

const STATUS_COLOR = { open: 'info', won: 'success', lost: 'error' } as const;

/** Lead(s) do contato no painel lateral da conversa: criar/vincular em um clique. */
export function CrmInboxDealPanel({ conversation }: { conversation: CrmConversation }) {
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [linking, setLinking] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CrmDeal[]>([]);

  const contactId = conversation.contact.id;

  const load = useCallback(() => {
    setLoading(true);
    CrmService.conversationDeals(conversation.id)
      .then(setDeals)
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [conversation.id]);

  useEffect(() => {
    load();
  }, [load]);

  useCrmSocketEvent<CrmDealSocketPayload>('crm:deal:updated', ({ deal }) => {
    if (isDeletedDeal(deal)) setDeals((list) => list.filter((d) => d.id !== deal.id));
    else if (deal.contactId === contactId) setDeals((list) => upsertDeal(list, deal));
  });

  useEffect(() => {
    if (!linking || query.trim().length < 2) {
      setOptions([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      CrmService.listDeals({ search: query.trim(), status: 'open', perPage: 15 })
        .then((res) => setOptions(res.data.filter((d) => !d.contactId)))
        .catch(() => setOptions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [linking, query]);

  const open = async (dealId?: string) => {
    setCreating(true);
    try {
      const res = await CrmService.openConversationDeal(conversation.id, dealId);
      setDeals((list) => upsertDeal(list, res.deal));
      setLinking(false);
      toast.success(res.created ? 'Lead criado no funil.' : 'Lead vinculado à conversa.');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível criar o lead.');
    } finally {
      setCreating(false);
    }
  };

  const openDeals = deals.filter((d) => d.status === 'open');
  const closedDeals = deals.filter((d) => d.status !== 'open').slice(0, 3);

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center">
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Funil de captação
        </Typography>
        {loading && <Typography variant="caption">…</Typography>}
      </Stack>

      {[...openDeals, ...closedDeals].map((d) => {
        const idle = daysSince(d.lastInteractionAt);
        return (
          <Box key={d.id} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral', borderLeft: 3, borderColor: d.stage?.color ?? 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Link component={RouterLink} href={paths.dashboard.crm.lead(d.id)} variant="subtitle2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {d.title}
              </Link>
              <Label variant="soft" color={STATUS_COLOR[d.status]}>
                {d.status === 'open' ? d.stage?.name ?? '' : CRM_DEAL_STATUS_LABELS[d.status]}
              </Label>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {[
                d.owner?.name ? `Resp.: ${d.owner.name}` : 'Sem responsável',
                d.estimatedValue != null ? fCurrency(d.estimatedValue) : null,
                d.openTasks ? `${d.openTasks} tarefa(s)` : null,
                idle !== null ? `interação ${idle === 0 ? 'hoje' : `há ${idle}d`}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        );
      })}

      {!loading && !openDeals.length && (
        <Stack spacing={1}>
          <LoadingButton
            size="small"
            variant="outlined"
            loading={creating}
            onClick={() => open()}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Criar lead desta conversa
          </LoadingButton>
          {linking ? (
            <Autocomplete
              size="small"
              options={options}
              filterOptions={(x) => x}
              getOptionLabel={(o) => o.title}
              inputValue={query}
              onInputChange={(_e, v) => setQuery(v)}
              onChange={(_e, o) => o && open(o.id)}
              renderOption={(props, o) => (
                <li {...props} key={o.id}>
                  <Stack>
                    <Typography variant="body2">{o.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {[o.stage?.name, o.guardianName, o.owner?.name].filter(Boolean).join(' · ')}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => <TextField {...params} autoFocus label="Lead sem conversa" placeholder="Nome do aluno ou responsável" />}
              noOptionsText={query.trim().length < 2 ? 'Digite ao menos 2 letras' : 'Nenhum lead aberto sem contato'}
            />
          ) : (
            <Button size="small" color="inherit" onClick={() => setLinking(true)}>
              Vincular a um lead existente
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
