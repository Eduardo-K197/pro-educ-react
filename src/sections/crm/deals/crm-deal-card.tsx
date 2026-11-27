'use client';

import type { CrmDeal } from 'src/types/services/crm-deal';

import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import { CRM_DEAL_SOURCE_LABELS } from 'src/types/services/crm-deal';

import { daysSince } from './crm-deal-utils';

// ----------------------------------------------------------------------

type CardProps = {
  deal: CrmDeal;
  onOpen?: (deal: CrmDeal) => void;
  dragging?: boolean;
};

export function CrmDealCardContent({ deal, onOpen, dragging }: CardProps) {
  const idle = daysSince(deal.lastInteractionAt ?? deal.createdAt);
  const subtitle = [deal.studentName && deal.studentName !== deal.title ? deal.studentName : null, deal.interestLabel].filter(Boolean).join(' · ');

  return (
    <Card
      onClick={() => onOpen?.(deal)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        borderLeft: 4,
        borderColor: deal.stage?.color ?? 'divider',
        boxShadow: dragging ? (theme) => theme.customShadows.z20 : undefined,
        opacity: deal.status === 'lost' ? 0.75 : 1,
        '&:hover': { boxShadow: (theme) => theme.customShadows.z8 },
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 0 }} noWrap>
            {deal.title}
          </Typography>
          {deal.convertedStudentId && (
            <Tooltip title="Convertido em matrícula">
              <Iconify icon="solar:diploma-verified-bold" width={18} sx={{ color: 'success.main' }} />
            </Tooltip>
          )}
        </Stack>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
            {subtitle}
          </Typography>
        )}
        {deal.status === 'lost' && deal.lostReason && (
          <Typography variant="caption" sx={{ color: 'error.main' }} noWrap>
            {deal.lostReason}
          </Typography>
        )}
        {!!deal.tags.length && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {deal.tags.map((t) => (
              <Box key={t.id} sx={{ px: 0.75, borderRadius: 0.75, bgcolor: t.color, color: 'common.white', typography: 'caption', fontSize: 11 }}>
                {t.name}
              </Box>
            ))}
          </Stack>
        )}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
          {deal.estimatedValue != null && (
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {fCurrency(deal.estimatedValue)}
            </Typography>
          )}
          {deal.source && <Typography variant="caption">{CRM_DEAL_SOURCE_LABELS[deal.source] ?? deal.source}</Typography>}
          <Box sx={{ flex: 1 }} />
          {deal.openTasks > 0 && (
            <Tooltip title={`${deal.openTasks} tarefa(s) aberta(s)`}>
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <Iconify icon="solar:checklist-minimalistic-bold" width={14} />
                <Typography variant="caption">{deal.openTasks}</Typography>
              </Stack>
            </Tooltip>
          )}
          {deal.status === 'open' && idle !== null && (
            <Tooltip title="Dias desde a última interação">
              <Typography variant="caption" sx={{ color: idle >= 7 ? 'warning.main' : 'inherit' }}>
                {idle === 0 ? 'hoje' : `${idle}d`}
              </Typography>
            </Tooltip>
          )}
          {deal.owner && (
            <Tooltip title={deal.owner.name ?? 'Responsável'}>
              <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{(deal.owner.name ?? '?').charAt(0).toUpperCase()}</Avatar>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

/** Card arrastável do kanban. */
export function CrmDealCard({ deal, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id, data: { deal } });
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, touchAction: 'manipulation' }}
    >
      <CrmDealCardContent deal={deal} onOpen={onOpen} />
    </Box>
  );
}
