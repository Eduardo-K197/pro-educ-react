'use client';

import type { EntryListItem } from 'src/types/services/entry';
import { getTraducedStatus } from 'src/types/services/entry';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Pago: 'success',
  Pendente: 'warning',
  Atrasado: 'error',
  Cancelado: 'default',
};

const BILLING_LABEL: Record<string, string> = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  MONEY: 'Dinheiro',
  CREDIT_CARD: 'Cartão',
};

type Props = {
  row: EntryListItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onConfirmPayment?: (row: EntryListItem) => void;
  canDelete?: boolean;
};

export function FinancialTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onConfirmPayment,
  canDelete = true,
}: Props) {
  const confirm = useBoolean();
  const popover = usePopover();

  const displayStatus = getTraducedStatus(row);
  const statusColor = STATUS_COLOR[displayStatus] ?? 'default';
  const isOverdue = displayStatus === 'Atrasado';
  const isPending = displayStatus === 'Pendente';

  const invoiceUrl = row.bankSlipUrl ?? row.invoiceUrl;
  const isSicredi = row.source === 'sicredi';
  const sourceLabel =
    row.source === 'cora' ? 'Cora' : row.source === 'asaas' ? 'Asaas' : isSicredi ? 'Sicredi' : null;

  const studentName = row.student?.name;
  const guardianName = row.student?.guardian?.name;
  const studentPhone = row.student?.phoneNumber ?? (row.student as any)?.phone;

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        {/* Descrição / Aluno / Responsável */}
        <TableCell sx={{ minWidth: 180 }}>
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {row.description ?? '-'}
            </Typography>
            {studentName && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Aluno: {studentName}
                {studentPhone ? ` · ${studentPhone}` : ''}
              </Typography>
            )}
            {guardianName && (
              <Typography variant="caption" color="text.disabled" noWrap>
                Resp: {guardianName}
              </Typography>
            )}
          </Stack>
        </TableCell>

        {/* Valor Pago */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color={isOverdue ? 'error.main' : 'text.primary'}
          >
            {row.paymentDate ? fCurrency(row.value) : '—'}
          </Typography>
        </TableCell>

        {/* Valor Original */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2">
            {fCurrency(row.originalValue ?? row.value)}
          </Typography>
        </TableCell>

        {/* Vencimento */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.dueDate ? (
            <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'}>
              {fDate(row.dueDate)}
            </Typography>
          ) : '—'}
        </TableCell>

        {/* Data Pagamento */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" color={row.paymentDate ? 'success.main' : 'text.disabled'}>
            {row.paymentDate ? fDate(row.paymentDate) : 'Não pago'}
          </Typography>
        </TableCell>

        {/* Nº Parcela */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" color="text.secondary">
            {row.installmentNumber != null ? `${row.installmentNumber}ª` : '—'}
          </Typography>
        </TableCell>

        {/* Status + Fonte */}
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
            <Label variant="soft" color={statusColor}>
              {displayStatus}
            </Label>
            {sourceLabel && (
              <Chip
                label={sourceLabel}
                size="small"
                color={row.source === 'cora' ? 'primary' : isSicredi ? 'success' : 'default'}
                variant="outlined"
              />
            )}
          </Stack>
        </TableCell>

        {/* Tipo */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" color="text.secondary">
            {row.billingType ? BILLING_LABEL[row.billingType] ?? row.billingType : '—'}
          </Typography>
        </TableCell>

        {/* Ações */}
        <TableCell align="right">
          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
            {isPending && onConfirmPayment && (
              <Tooltip title="Confirmar recebimento">
                <IconButton size="small" color="success" onClick={() => onConfirmPayment(row)}>
                  <Iconify icon="solar:check-circle-bold-duotone" />
                </IconButton>
              </Tooltip>
            )}
            {isSicredi ? (
              <>
                {row.bankSlipUrl ? (
                  <Tooltip title="Copiar linha digitável">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => {
                        navigator.clipboard.writeText(row.bankSlipUrl!);
                        toast.success('Linha digitável copiada!');
                      }}
                    >
                      <Iconify icon="solar:clipboard-bold" />
                    </IconButton>
                  </Tooltip>
                ) : (isPending || isOverdue) ? (
                  <Tooltip title="Boleto sem registro no Sicredi — precisa ser reemitido">
                    <span>
                      <IconButton size="small" disabled>
                        <Iconify icon="solar:file-text-bold" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
                {row.invoiceUrl && (
                  <Tooltip title="Copiar código PIX">
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(row.invoiceUrl!);
                        toast.success('Código PIX copiado!');
                      }}
                    >
                      <Iconify icon="solar:qr-code-bold" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            ) : (
              invoiceUrl && (
                <Tooltip title={row.source === 'cora' ? 'Ver cobrança na Cora' : 'Ver cobrança no Asaas'}>
                  <IconButton size="small" onClick={() => window.open(invoiceUrl, '_blank')}>
                    <Iconify icon="solar:link-bold" />
                  </IconButton>
                </Tooltip>
              )
            )}
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {isPending && onConfirmPayment && (
            <MenuItem
              onClick={() => { onConfirmPayment(row); popover.onClose(); }}
              sx={{ color: 'success.main' }}
            >
              <Iconify icon="solar:check-circle-bold" />
              Confirmar recebimento
            </MenuItem>
          )}
          {canDelete && (
            <MenuItem onClick={() => { confirm.onTrue(); popover.onClose(); }} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" />
              Excluir
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir lançamento"
        content="Tem certeza que deseja excluir este lançamento?"
        action={
          <MenuItem onClick={() => { onDeleteRow(); confirm.onFalse(); }} sx={{ color: 'error.main' }}>
            Excluir
          </MenuItem>
        }
      />
    </>
  );
}
