import type { CrmTicket } from 'src/types/services/crm-ticket';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Quem abriu o chamado; chamados abertos pela IA ganham o selo "IA". */
export function CrmTicketCreatedBy({ createdBy }: { createdBy: CrmTicket['createdBy'] }) {
  if (createdBy.type === 'ai') {
    return (
      <Tooltip title="Aberto pela IA durante o autoatendimento">
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Label variant="soft" color="secondary" startIcon={<Iconify icon="solar:stars-bold" width={14} />}>
            IA
          </Label>
          {createdBy.name && (
            <Typography variant="body2" noWrap>
              {createdBy.name}
            </Typography>
          )}
        </Stack>
      </Tooltip>
    );
  }
  return (
    <Typography variant="body2" noWrap>
      {createdBy.name || '—'}
    </Typography>
  );
}
