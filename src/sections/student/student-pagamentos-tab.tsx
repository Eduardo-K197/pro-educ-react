'use client';

import type { BillingType, EntryListItem, EntryCategory } from 'src/types/services/entry';

import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { useRolePermissions } from 'src/hooks/use-role-permissions';
import { useCoraInstallmentJob } from 'src/hooks/use-cora-installment-job';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { localDateString, buildEntryPayload } from 'src/utils/financial';

import { varAlpha } from 'src/theme/styles';
import { EntryService } from 'src/services/entry';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { getTraducedStatus } from 'src/types/services/entry';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  Pago: 'success',
  Atrasado: 'error',
  Pendente: 'warning',
  Cancelado: 'default',
};

const BILLING_LABELS: Record<string, string> = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  MONEY: 'Dinheiro',
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito',
  TRANSFER: 'Transferência',
  CRYPTO: 'Criptomoeda',
  OTHER: 'Outros',
};

interface Props {
  studentId: number;
}

function downloadPdfBase64(base64: string, filename: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) bytes[i] = binaryString.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Group entries: entries with a non-null installment value that appear more than once are grouped
interface EntryGroup {
  installmentId: string | null;
  entries: EntryListItem[];
  isGroup: boolean;
  description?: string;
  totalValue: number;
}

function groupEntries(entries: EntryListItem[]): EntryGroup[] {
  // count how many entries share each installment id
  const installmentCount: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.installment) {
      installmentCount[e.installment] = (installmentCount[e.installment] ?? 0) + 1;
    }
  });

  const groups: EntryGroup[] = [];
  const seenInstallments = new Set<string>();

  entries.forEach((entry) => {
    const instId = entry.installment ?? null;
    const isGrouped = instId !== null && installmentCount[instId] > 1;

    if (isGrouped && !seenInstallments.has(instId!)) {
      seenInstallments.add(instId!);
      const siblings = entries.filter((e) => e.installment === instId);
      groups.push({
        installmentId: instId,
        entries: siblings,
        isGroup: true,
        description: siblings[0]?.description ?? undefined,
        totalValue: siblings.reduce((sum, e) => sum + (Number(e.value) || 0), 0),
      });
    } else if (!isGrouped) {
      groups.push({
        installmentId: null,
        entries: [entry],
        isGroup: false,
        totalValue: entry.value,
      });
    }
    // grouped entries after first are already captured above
  });

  return groups;
}

export function StudentPagamentosTab({ studentId }: Props) {
  const { canCreateFinancial, canDeleteFinancial } = useRolePermissions();
  const [loadError, setLoadError] = useState(false);
  const [created, setCreated] = useState(false);
  const [jobMessage, setJobMessage] = useState('');
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [categories, setCategories] = useState<EntryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amountMode, setAmountMode] = useState('installment');
  const [formStatus, setFormStatus] = useState('PENDING');
  const [formPaymentDate, setFormPaymentDate] = useState(localDateString());
  const [formValue, setFormValue] = useState('');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formDueDate, setFormDueDate] = useState('');
  const [formBillingType, setFormBillingType] = useState<BillingType>('BOLETO');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstallmentCount, setFormInstallmentCount] = useState('1');
  const [linhaDigitavel, setLinhaDigitavel] = useState<string | null>(null);

  // action states
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<EntryListItem | null>(null);
  const [canceling, setCanceling] = useState(false);

  // collapse state for groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const loadEntries = useCallback(() => {
    setLoading(true);
    setForbidden(false);
    setLoadError(false);
    EntryService.listEntries({ student: String(studentId), hasPagination: false })
      .then((res) => setEntries(res.entries ?? []))
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403 || status === 401) {
          setForbidden(true);
        } else {
          setEntries([]);
          setLoadError(true);
          toast.error('Erro ao carregar pagamentos');
        }
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const carnetJob = useCoraInstallmentJob(studentId, loadEntries);

  useEffect(() => {
    loadEntries();
    EntryService.listCategories()
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {});
  }, [loadEntries]);

  const openDialog = () => {
    setCreated(false);
    setJobMessage('');
    setAmountMode('installment');
    setFormStatus('PENDING'); setFormPaymentDate(localDateString());
    setFormValue('');
    setFormDiscount('0');
    setFormDueDate('');
    setFormBillingType('BOLETO');
    setFormCategoryId('');
    setFormDescription('');
    setFormInstallmentCount('1');
    setLinhaDigitavel(null);
    setDialogOpen(true);
  };

  const usesGateway = formBillingType === 'BOLETO';

  const handleSave = async () => {
    if (saving || created || (usesGateway && carnetJob.blocked)) return;
    const val = parseFloat(formValue);
    if (!val || val <= 0) {
      toast.error('Informe o valor do pagamento');
      return;
    }
    setSaving(true);
    try {
      const payload = buildEntryPayload({
        value: val, discount: Number(formDiscount), dueDate: formDueDate,
        billingType: formBillingType, categoryId: formCategoryId,
        description: formDescription, studentId, amountMode, status: formStatus, paymentDate: formPaymentDate,
        installmentCount: usesGateway ? Number(formInstallmentCount) : 1,
      });
      if (usesGateway) {
        const result: any = await EntryService.createPayment(payload);
        if (result?.processing && result?.jobId) { carnetJob.start(result.jobId); setJobMessage('Carnê em processamento. Não envie novamente; acompanhe o resultado nesta ficha.'); }
        if (result?.source === 'sicredi') {
          const linha = result?.bankSlipUrl ?? result?.invoiceUrl;
          if (linha) setLinhaDigitavel(linha);
        } else {
          const url = result?.bankSlipUrl ?? result?.invoiceUrl;
          if (url) window.open(url, '_blank');
        }
      } else {
        await EntryService.createEntry(payload);
      }
      setCreated(true);
      toast.success('Solicitação registrada com sucesso!');
      if (!usesGateway) setDialogOpen(false);
      loadEntries();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erro ao criar lançamento';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBoleto = async (entry: EntryListItem) => {
    setDownloadingId(entry.id);
    try {
      if (entry.source === 'sicredi') {
        if (!entry.payment) throw new Error('Identificador do boleto indisponível.');
        const pdfId = entry.payment;
        const { pdfBase64 } = await EntryService.getInstallmentPdf(pdfId as string);
        downloadPdfBase64(pdfBase64, `boleto-${entry.id}.pdf`);
      } else if (entry.source === 'cora') {
        const result = await EntryService.getPaymentById(entry.id);
        const url = result.bankSlipUrl || result.invoiceUrl;
        if (!url) throw new Error('Boleto indisponível.');
        window.open(url, '_blank', 'noopener,noreferrer');
      } else if (entry.bankSlipUrl) {
        window.open(entry.bankSlipUrl, '_blank');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao baixar boleto';
      toast.error(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMarkReceived = async (entry: EntryListItem) => {
    setReceivingId(entry.id);
    try {
      await EntryService.updateEntry(entry.id, {
        status: 'RECEIVED_IN_CASH',
        paymentDate: localDateString(),
      });
      toast.success('Lançamento marcado como recebido!');
      loadEntries();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao registrar recebimento';
      toast.error(msg);
    } finally {
      setReceivingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      if (getTraducedStatus(cancelTarget) === 'Pago') return;
      await EntryService.deleteEntry(cancelTarget.id);
      toast.success('Lançamento cancelado!');
      loadEntries();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao cancelar';
      toast.error(msg);
    } finally {
      setCanceling(false);
      setCancelTarget(null);
    }
  };

  const toggleGroup = (instId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(instId)) next.delete(instId);
      else next.add(instId);
      return next;
    });
  };

  const entryGroups = useMemo(() => groupEntries(entries), [entries]);

  const renderEntryRow = (entry: EntryListItem, indented = false) => {
    const status = getTraducedStatus(entry);
    const color = STATUS_COLOR[status] ?? 'default';
    const isActive = status === 'Pendente' || status === 'Atrasado';
    const isBoleto = String(entry.billingType).toUpperCase() === 'BOLETO';
    const isMoney = ['MONEY', 'DINHEIRO'].includes(String(entry.billingType).toUpperCase());
    const isManual = entry.source === 'proeduc' || entry.source === 'manual';
    const isSicredi = entry.source === 'sicredi';
    const isDownloading = downloadingId === entry.id;
    const isReceiving = receivingId === entry.id;
    const hasDiscount = entry.originalValue && entry.originalValue > entry.value;

    return (
      <TableRow
        key={entry.id}
        hover
        sx={indented ? { '& .MuiTableCell-root': { pl: 4 } } : undefined}
      >
        <TableCell>
          <Typography variant="body2">{entry.description ?? '—'}</Typography>
          {entry.installmentNumber && (
            <Typography variant="caption" color="text.disabled">
              Parcela {entry.installmentNumber}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {entry.category?.name ?? '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {BILLING_LABELS[entry.billingType ?? ''] ?? entry.billingType ?? '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {entry.dueDate ? fDate(entry.dueDate) : '—'}
          </Typography>
        </TableCell>
        <TableCell>
          {hasDiscount ? (
            <Tooltip
              title={
                <Stack spacing={0.5}>
                  <Typography variant="caption">Valor original: {fCurrency(entry.originalValue!)}</Typography>
                  <Typography variant="caption">Com pontualidade: {fCurrency(entry.value)}</Typography>
                </Stack>
              }
            >
              <Stack>
                <Typography variant="body2" fontWeight={500} color="success.main">
                  {fCurrency(entry.value)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ textDecoration: 'line-through' }}
                >
                  {fCurrency(entry.originalValue!)}
                </Typography>
              </Stack>
            </Tooltip>
          ) : (
            <Typography variant="body2" fontWeight={500}>
              {fCurrency(entry.value)}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Label variant="soft" color={color}>
            {status || '—'}
          </Label>
          {isSicredi && !entry.bankSlipUrl && isActive && <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 0.5 }}>Migrado: PDF indisponível na Sicredi</Typography>}
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
            {isSicredi && entry.bankSlipUrl && (
              <Tooltip title="Copiar linha digitável">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => {
                    navigator.clipboard.writeText(entry.bankSlipUrl!);
                    toast.success('Linha digitável copiada!');
                  }}
                >
                  <Iconify icon="solar:clipboard-bold" width={16} />
                </IconButton>
              </Tooltip>
            )}
            {isSicredi && !entry.bankSlipUrl && isActive && (
              <Tooltip title="Boleto migrado do sistema anterior. PDF indisponível na Sicredi.">
                <span>
                  <IconButton size="small" disabled>
                    <Iconify icon="solar:file-text-bold" width={16} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {isSicredi && entry.invoiceUrl && (
              <Tooltip title="Copiar código PIX">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(entry.invoiceUrl!);
                    toast.success('Código PIX copiado!');
                  }}
                >
                  <Iconify icon="solar:qr-code-bold" width={16} />
                </IconButton>
              </Tooltip>
            )}
            {!isSicredi && entry.bankSlipUrl && (
              <Tooltip title="Ver boleto">
                <IconButton size="small" component="a" href={entry.bankSlipUrl} target="_blank">
                  <Iconify icon="solar:file-text-bold" width={16} />
                </IconButton>
              </Tooltip>
            )}
            {!isSicredi && entry.invoiceUrl && (
              <Tooltip title="Ver fatura">
                <IconButton size="small" component="a" href={entry.invoiceUrl} target="_blank">
                  <Iconify icon="solar:link-bold" width={16} />
                </IconButton>
              </Tooltip>
            )}
            {isBoleto && (isActive || status === 'Pago') && (!isSicredi || !!entry.bankSlipUrl || status === 'Pago') && (
              <Tooltip title="Baixar boleto PDF">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Baixar boleto PDF"
                    onClick={() => handleDownloadBoleto(entry)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <Iconify icon="solar:download-bold" width={16} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canCreateFinancial && isManual && isMoney && isActive && (
              <Tooltip title="Marcar como recebido">
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleMarkReceived(entry)}
                    disabled={isReceiving}
                  >
                    {isReceiving ? (
                      <CircularProgress size={14} />
                    ) : (
                      <Iconify icon="solar:check-circle-bold" width={16} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canDeleteFinancial && isActive && (
              <Tooltip title="Cancelar apenas esta parcela">
                <IconButton size="small" color="error" onClick={() => setCancelTarget(entry)}>
                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Stack spacing={3}>
      {!forbidden && canCreateFinancial && (
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={openDialog}
            >
              Novo lançamento
            </Button>
          </Stack>
        </Card>
      )}

      {loadError && <Alert severity="error" action={<Button color="inherit" onClick={loadEntries}>Tentar novamente</Button>}>Pagamentos indisponíveis. Isso não significa que o aluno esteja sem lançamentos.</Alert>}
      {carnetJob.message && <Alert severity="info">{carnetJob.message}</Alert>}
      {carnetJob.checkFailed && <Alert severity="warning" action={<Button color="inherit" onClick={carnetJob.retry}>Tentar novamente</Button>}>Não foi possível verificar se já existe um carnê em processamento. A geração de boletos está temporariamente indisponível para evitar duplicidade.</Alert>}
      <Card>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : forbidden ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.disabled' }}>
            <Iconify icon="solar:lock-bold-duotone" width={40} />
            <Typography variant="body2">Sem permissão para visualizar pagamentos.</Typography>
          </Stack>
        ) : loadError ? null : entries.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.disabled' }}>
            <Iconify icon="solar:wallet-bold-duotone" width={40} />
            <Typography variant="body2">Nenhum lançamento financeiro encontrado.</Typography>
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vencimento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {entryGroups.map((group) => {
                  if (!group.isGroup) {
                    return renderEntryRow(group.entries[0], false);
                  }

                  const instId = group.installmentId!;
                  const isCollapsed = collapsedGroups.has(instId);

                  const PROVIDER_LABELS: Record<string, string> = {
                    sicredi: 'Sicredi',
                    asaas: 'Asaas',
                    cora: 'Cora',
                  };
                  const firstEntry = group.entries[0];
                  const provider =
                    (firstEntry?.source && PROVIDER_LABELS[firstEntry.source]) ||
                    firstEntry?.source ||
                    'Carnê';
                  const dueDates = group.entries
                    .map((e) => e.dueDate)
                    .filter((d): d is string => !!d)
                    .sort();
                  const fmt = (d: string) => {
                    const dt = new Date(d);
                    return `${dt.toLocaleString('pt-BR', { month: 'short' })}/${dt.getFullYear()}`.replace('.', '');
                  };
                  const dateRange =
                    dueDates.length >= 2
                      ? `${fmt(dueDates[0])} – ${fmt(dueDates[dueDates.length - 1])}`
                      : dueDates.length === 1
                      ? fmt(dueDates[0])
                      : null;
                  const count = group.entries.length;

                  return (
                    <React.Fragment key={`group-${instId}`}>
                      {/* Group header row */}
                      <TableRow
                        sx={{
                          bgcolor: (theme) =>
                            varAlpha(theme.vars.palette.primary.mainChannel, 0.06),
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleGroup(instId)}
                      >
                        <TableCell colSpan={4}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Iconify
                              icon={isCollapsed ? 'solar:alt-arrow-right-bold' : 'solar:alt-arrow-down-bold'}
                              width={14}
                              sx={{ color: 'primary.main' }}
                            />
                            <Typography
                              component="span"
                              variant="body2"
                              fontWeight={700}
                              color="primary.main"
                            >
                              {provider}
                            </Typography>
                            {dateRange && (
                              <>
                                <Typography component="span" variant="caption" color="text.disabled" sx={{ mx: 0.25 }}>·</Typography>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {dateRange}
                                </Typography>
                              </>
                            )}
                            <Typography component="span" variant="caption" color="text.disabled" sx={{ mx: 0.25 }}>·</Typography>
                            <Chip
                              size="small"
                              label={`${count} parcela${count !== 1 ? 's' : ''}`}
                              color="primary"
                              variant="soft"
                              sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {fCurrency(group.totalValue)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell align="right">
                          <Button size="small" disabled={downloadingId === instId} onClick={async (event) => {
                            event.stopPropagation(); setDownloadingId(instId);
                            try {
                              const result = await EntryService.getInstallmentPdf(instId);
                              downloadPdfBase64(result.pdfBase64, `carne-${instId}.pdf`);
                            } catch { toast.error('Não foi possível baixar o carnê completo.'); }
                            finally { setDownloadingId(null); }
                          }}>Baixar carnê completo</Button>
                        </TableCell>
                      </TableRow>

                      {/* Group child rows */}
                      {!isCollapsed && group.entries.map((entry) => renderEntryRow(entry, true))}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Diálogo: novo lançamento */}
      <Dialog open={dialogOpen} onClose={() => { if (!saving) setDialogOpen(false); }} maxWidth="xs" fullWidth>
        <DialogTitle>Novo lançamento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Descrição"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formCategoryId}
                label="Categoria"
                onChange={(e) => setFormCategoryId(e.target.value)}
              >
                <MenuItem value="">Selecione a categoria</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Forma de pagamento</InputLabel>
              <Select
                value={formBillingType}
                label="Forma de pagamento"
                onChange={(e) => setFormBillingType(e.target.value as BillingType)}
              >
                <MenuItem value="BOLETO">Boleto</MenuItem>
                <MenuItem value="PIX">PIX</MenuItem>
                <MenuItem value="MONEY">Dinheiro</MenuItem>
                <MenuItem value="CREDIT_CARD">Cartão de crédito</MenuItem>
                <MenuItem value="DEBIT_CARD">Débito</MenuItem>
                <MenuItem value="TRANSFER">Transferência</MenuItem>
                <MenuItem value="CRYPTO">Criptomoeda</MenuItem>
                <MenuItem value="OTHER">Outros</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label={usesGateway ? amountMode === 'total' ? 'Valor total (R$) *' : 'Valor de cada parcela (R$) *' : 'Valor (R$) *'}
              type="number"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Desconto"
              type="number"
              value={formDiscount}
              onChange={(e) => setFormDiscount(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Vencimento"
              type="date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {usesGateway && <TextField select label="O valor informado representa" value={amountMode} onChange={(event) => setAmountMode(event.target.value)}><MenuItem value="installment">Valor de cada parcela</MenuItem><MenuItem value="total">Valor total do carnê</MenuItem></TextField>}
            {usesGateway && (
              <TextField
                fullWidth
                size="small"
                label="Número de parcelas"
                type="number"
                value={formInstallmentCount}
                onChange={(e) => setFormInstallmentCount(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
                helperText="Deixe 1 para pagamento à vista"
              />
            )}

            {created && <Alert severity="success">{jobMessage || 'Lançamento criado. Feche esta janela para conferir a lista.'}</Alert>}
            {!usesGateway && <TextField select fullWidth label="Situação do lançamento" value={formStatus} onChange={(event) => setFormStatus(event.target.value)}>
              <MenuItem value="PENDING">Pendente</MenuItem><MenuItem value="RECEIVED_IN_CASH">Já recebido</MenuItem>
            </TextField>}
            {!usesGateway && formStatus === 'RECEIVED_IN_CASH' && <TextField fullWidth label="Data do recebimento *" type="date" value={formPaymentDate} onChange={(event) => setFormPaymentDate(event.target.value)} InputLabelProps={{ shrink: true }} />}
            {!usesGateway && <Alert severity="info">Registro manual: nenhuma cobrança bancária ou chave PIX será emitida.</Alert>}
            {linhaDigitavel && (
              <Alert
                severity="success"
                action={
                  <Button
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(linhaDigitavel);
                      toast.success('Linha digitável copiada!');
                    }}
                  >
                    Copiar
                  </Button>
                }
              >
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                  Boleto Sicredi gerado!
                </Typography>
                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                  {linhaDigitavel}
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            {linhaDigitavel ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || created || (usesGateway && carnetJob.blocked)}>
            {saving ? 'Salvando...' : created ? 'Solicitação registrada' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: confirmar cancelamento */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar lançamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apenas esta parcela será cancelada. As demais parcelas do carnê serão preservadas. Deseja continuar com o lançamento
            {cancelTarget?.description ? ` "${cancelTarget.description}"` : ''}
            {cancelTarget?.value ? ` de ${fCurrency(cancelTarget.value)}` : ''}?
            {cancelTarget?.source === 'sicredi' || cancelTarget?.source === 'cora'
              ? ' O título também será cancelado no banco.'
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} disabled={canceling}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={canceling}
          >
            {canceling ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
