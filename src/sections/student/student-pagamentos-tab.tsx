'use client';

import { useState, useEffect, useCallback } from 'react';

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

import Tooltip from '@mui/material/Tooltip';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
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
};

interface Props {
  studentId: number;
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
  const [linhaDigitavel, setLinhaDigitavel] = useState<string | null>(null);

  const loadEntries = useCallback(() => {
    setLoading(true);
    setForbidden(false);
    EntryService.listEntries({ student: String(studentId) })
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
    setLinhaDigitavel(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const val = parseFloat(formValue);
    if (!val || val <= 0) {
      toast.error('Informe o valor do pagamento');
      return;
    }
    setSaving(true);
    const usesGateway = formBillingType === 'BOLETO' || formBillingType === 'PIX';
    try {
      const payload = {
        value: val,
        discount: parseFloat(formDiscount) || 0,
        dueDate: formDueDate || undefined,
        billingType: formBillingType,
        categoryId: formCategoryId || undefined,
        description: formDescription || undefined,
        studentId,
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
                {entries.map((entry) => {
                  const status = entry.traducedStatus ?? '';
                  const color = STATUS_COLOR[status] ?? 'default';
                  return (
                    <TableRow key={entry.id} hover>
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
                        <Typography variant="body2" fontWeight={500}>
                          {fCurrency(entry.value)}
                        </Typography>
                        {entry.originalValue && entry.originalValue !== entry.value && (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {fCurrency(entry.originalValue)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={color}>
                          {status || '—'}
                        </Label>
                      </TableCell>
                      <TableCell align="right">
                        {entry.source === 'sicredi' ? (
                          <>
                            {entry.bankSlipUrl ? (
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
                            ) : (status === 'Pendente' || status === 'Atrasado') ? (
                              <Tooltip title="Boleto sem registro no Sicredi — precisa ser reemitido">
                                <span>
                                  <IconButton size="small" disabled>
                                    <Iconify icon="solar:file-text-bold" width={16} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : null}
                            {entry.invoiceUrl && (
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
                          </>
                        ) : (
                          <>
                            {entry.bankSlipUrl && (
                              <IconButton
                                size="small"
                                component="a"
                                href={entry.bankSlipUrl}
                                target="_blank"
                                title="Ver boleto"
                              >
                                <Iconify icon="solar:file-text-bold" width={16} />
                              </IconButton>
                            )}
                            {entry.invoiceUrl && (
                              <IconButton
                                size="small"
                                component="a"
                                href={entry.invoiceUrl}
                                target="_blank"
                                title="Ver fatura"
                              >
                                <Iconify icon="solar:link-bold" width={16} />
                              </IconButton>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create dialog */}
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
                <MenuItem value="CREDIT_CARD">Crédito</MenuItem>
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
    </Stack>
  );
}
