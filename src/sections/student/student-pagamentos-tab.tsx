'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
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

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { varAlpha } from 'src/theme/styles';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import type { EntryListItem, EntryCategory, BillingType } from 'src/types/services/entry';
import { EntryService } from 'src/services/entry';

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
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
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
        totalValue: siblings.reduce((sum, e) => sum + (e.value ?? 0), 0),
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
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [categories, setCategories] = useState<EntryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
    EntryService.listEntries({ student: String(studentId), perPage: '200' })
      .then((res) => setEntries(res.entries ?? []))
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403 || status === 401) {
          setForbidden(true);
        } else {
          toast.error('Erro ao carregar pagamentos');
        }
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    loadEntries();
    EntryService.listCategories()
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {});
  }, [loadEntries]);

  const openDialog = () => {
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

  const usesGateway = formBillingType === 'BOLETO' || formBillingType === 'PIX';

  const handleSave = async () => {
    const val = parseFloat(formValue);
    if (!val || val <= 0) {
      toast.error('Informe o valor do pagamento');
      return;
    }
    setSaving(true);
    try {
      const installmentCount = parseInt(formInstallmentCount, 10) || 1;
      const payload = {
        value: val,
        discount: parseFloat(formDiscount) || 0,
        dueDate: formDueDate || undefined,
        billingType: formBillingType,
        categoryId: formCategoryId || undefined,
        description: formDescription || undefined,
        studentId,
        ...(usesGateway && installmentCount > 1 ? { installmentCount } : {}),
      };
      if (usesGateway) {
        const result: any = await EntryService.createPayment(payload);
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
      toast.success('Lançamento criado!');
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
        const pdfId = entry.installment ?? entry.payment ?? entry.id;
        const { pdfBase64 } = await EntryService.getInstallmentPdf(pdfId as string);
        downloadPdfBase64(pdfBase64, `boleto-${entry.id}.pdf`);
      } else if (entry.installment) {
        const { pdfBase64 } = await EntryService.getInstallmentPdf(entry.installment);
        downloadPdfBase64(pdfBase64, `boleto-${entry.installment}.pdf`);
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
        paidAt: new Date().toISOString().slice(0, 10),
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
      if (cancelTarget.installment) {
        await EntryService.deleteInstallment(cancelTarget.installment);
      } else {
        await EntryService.deleteEntry(cancelTarget.id);
      }
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
    const status = entry.traducedStatus ?? '';
    const color = STATUS_COLOR[status] ?? 'default';
    const isActive = status === 'Pendente' || status === 'Atrasado';
    const isBoleto = entry.billingType === 'BOLETO';
    const isMoney = entry.billingType === 'MONEY';
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
              <Tooltip title="Boleto sem registro no Sicredi — precisa ser reemitido">
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
            {isBoleto && isActive && (entry.bankSlipUrl || entry.installment || isSicredi) && (
              <Tooltip title="Baixar boleto PDF">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
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
            {isManual && isMoney && status === 'Pendente' && (
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
            {isActive && (
              <Tooltip title="Cancelar lançamento">
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
      {!forbidden && (
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
        ) : entries.length === 0 ? (
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

                  return (
                    <>
                      {/* Group header row */}
                      <TableRow
                        key={`group-${instId}`}
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
                            <Typography variant="body2" fontWeight={600}>
                              Carnê — {group.description ?? 'Parcelado'}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${group.entries.length} parcelas`}
                              color="primary"
                              variant="soft"
                              sx={{ height: 18, fontSize: 11 }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {fCurrency(group.totalValue)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>

                      {/* Group child rows */}
                      {!isCollapsed && group.entries.map((entry) => renderEntryRow(entry, true))}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Diálogo: novo lançamento */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
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
                <MenuItem value="">Sem categoria</MenuItem>
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
                <MenuItem value="OTHER">Outros</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Valor *"
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
          <Button variant="contained" onClick={handleSave} disabled={saving || !!linhaDigitavel}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: confirmar cancelamento */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar lançamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja cancelar este lançamento
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
