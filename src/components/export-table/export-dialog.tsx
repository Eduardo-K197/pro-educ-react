'use client';

import type {
  ExportInput,
  ExportColumn,
  ExportFilters,
  ExportPreview,
  ExportResource,
  ExportDefinition,
} from 'src/services/export';

import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { exportError, ExportService } from 'src/services/export';
import { stylesMode } from 'src/theme/styles';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

function dateText(value: unknown) {
  const text = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text.split('-').reverse().join('/') : text;
}
function previewValue(value: unknown, column: ExportColumn) {
  if (value === null || value === undefined || value === '') return '—';
  if (column.type === 'date') return dateText(value);
  if (column.type === 'money')
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return String(value);
}
function validDate(value: string) {
  if (!value) return true;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function ExportDialog({
  resource,
  initialFilters = {},
  onClose,
}: {
  resource: ExportResource;
  initialFilters?: ExportFilters;
  onClose: () => void;
}) {
  const [definition, setDefinition] = useState<ExportDefinition | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [status, setStatus] = useState(initialFilters.status ?? 'all');
  const [dateField, setDateField] = useState(initialFilters.dateField ?? '');
  const [from, setFrom] = useState(initialFilters.from ?? '');
  const [to, setTo] = useState(initialFilters.to ?? '');
  const [preset, setPreset] = useState(initialFilters.from || initialFilters.to ? 'list' : 'all');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [previewKey, setPreviewKey] = useState('');
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState(false);
  const downloadAbort = useRef<AbortController | null>(null);
  const initial = useRef(initialFilters);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setLoading(true);
    ExportService.options(resource, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (resource === 'financial') {
          const defaults = new Set(['studentName', 'value', 'originalValue', 'dueDate', 'category', 'status']);
          data = { ...data, columns: data.columns.map((column) => ({ ...column, default: defaults.has(column.id) })) };
        }
        setDefinition(data);
        setColumns(data.columns.filter((column) => column.default).map((column) => column.id));
        setDateField(initial.current.dateField ?? data.dates[0]?.id ?? '');
      })
      .catch(async (failure) => {
        if (!controller.signal.aborted) {
          const message = await exportError(failure);
          if (!controller.signal.aborted) setError(message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [resource, retry]);
  useEffect(() => () => downloadAbort.current?.abort(), []);
  const dateError =
    !validDate(from) || !validDate(to)
      ? 'Informe datas válidas.'
      : from && to && from > to
        ? 'A data inicial deve ser anterior ou igual à data final.'
        : '';
  const input = useMemo<ExportInput>(
    () => ({
      columns,
      search,
      status,
      ...(dateField ? { dateField } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      includeSummary,
    }),
    [columns, search, status, dateField, from, to, includeSummary]
  );
  const [previewRetry, setPreviewRetry] = useState(0);
  useEffect(() => {
    if (!definition || !columns.length || dateError) {
      setPreview(null);
      if (definition) setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setPreview(null);
    const timer = setTimeout(() => {
      ExportService.preview(resource, input, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setPreview(data);
            setPreviewKey(JSON.stringify(input));
          }
        })
        .catch(async (failure) => {
          if (!controller.signal.aborted) {
            const message = await exportError(failure);
            if (!controller.signal.aborted) setError(message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [resource, definition, columns.length, dateError, input, previewRetry]);
  const selectedColumns = definition?.columns.filter((column) => columns.includes(column.id)) ?? [];
  const groups = Array.from(new Set(definition?.columns.map((column) => column.group) ?? []));
  const setPeriod = (value: string) => {
    setPreset(value);
    const now = new Date();
    if (value === 'all') {
      setFrom('');
      setTo('');
    }
    if (value === 'list') {
      setFrom(initial.current.from ?? '');
      setTo(initial.current.to ?? '');
      setDateField(initial.current.dateField ?? definition?.dates[0]?.id ?? '');
    }
    if (value === 'month') {
      setFrom(localDay(new Date(now.getFullYear(), now.getMonth(), 1)));
      setTo(localDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    }
    if (value === 'previous') {
      setFrom(localDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
      setTo(localDay(new Date(now.getFullYear(), now.getMonth(), 0)));
    }
    if (value === 'year') {
      setFrom(`${now.getFullYear()}-01-01`);
      setTo(`${now.getFullYear()}-12-31`);
    }
  };
  const download = async () => {
    if (
      !preview?.canExport ||
      previewKey !== JSON.stringify(input) ||
      loading ||
      exporting ||
      dateError ||
      !columns.length
    )
      return;
    setExporting(true);
    setError('');
    const controller = new AbortController();
    downloadAbort.current = controller;
    try {
      const blob = await ExportService.download(resource, input, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${definition?.filename ?? resource}-${localDay(new Date())}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Planilha Excel gerada.');
      onClose();
    } catch (failure) {
      if (!controller.signal.aborted) setError(await exportError(failure));
    } finally {
      setExporting(false);
    }
  };
  return (
    <Dialog
      open
      onClose={() => {
        if (!exporting) onClose();
      }}
      fullWidth
      maxWidth="md"
      aria-labelledby="export-title"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
            '& input[type="date"]': { colorScheme: 'light' },
            [stylesMode.dark]: { '& input[type="date"]': { colorScheme: 'dark' } },
          maxHeight: 'calc(100% - 32px)',
          m: { xs: 1, sm: 3 },
          width: { xs: 'calc(100% - 16px)', sm: '100%' },
        },
      }}
    >
      <DialogTitle id="export-title" sx={{ pb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'success.lighter',
              color: 'success.dark',
              borderRadius: 1.5,
            }}
          >
            <Iconify icon="solar:document-text-bold-duotone" width={28} />
          </Box>
          <Box>
            <Typography component="span" variant="h6">
              Exportar {definition?.title.toLocaleLowerCase('pt-BR') ?? 'planilha'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escolha as informações. A planilha sai pronta para usar.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="success" variant="soft" label="Excel (.xlsx)" />
            <Chip size="small" variant="outlined" label="Todas as páginas da lista" />
          </Stack>
          {error && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  onClick={() => {
                    if (definition) setPreviewRetry((value) => value + 1);
                    else setRetry((value) => value + 1);
                  }}
                  disabled={exporting}
                >
                  Tentar novamente
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          {!definition && loading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">Preparando opções de exportação…</Typography>
            </Stack>
          )}
          {definition && (
            <>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                  1. Registros e período
                </Typography>
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: '1fr',
                    sm: definition.statuses?.length ? '2fr 1fr' : '1fr',
                  }}
                  gap={2}
                >
                  <TextField
                    label="Buscar na exportação"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    disabled={exporting}
                    inputProps={{ maxLength: 200 }}
                    helperText="A busca e os filtros da lista já vêm preenchidos."
                  />
                  {definition.statuses?.length ? (
                    <TextField
                      select
                      label="Situação"
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      disabled={exporting}
                    >
                      <MenuItem value="all">Todas</MenuItem>
                      {definition.statuses.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}
                </Box>
                {!!definition.dates.length && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                      <TextField
                        select
                        label="Data usada no período"
                        value={dateField}
                        onChange={(event) => setDateField(event.target.value)}
                        disabled={exporting}
                      >
                        {definition.dates.map((date) => (
                          <MenuItem key={date.id} value={date.id}>
                            {date.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Período"
                        value={preset}
                        onChange={(event) => setPeriod(event.target.value)}
                        disabled={exporting}
                      >
                        {(initial.current.from || initial.current.to) && (
                          <MenuItem value="list">Período da lista</MenuItem>
                        )}
                        <MenuItem value="all">Todo o histórico</MenuItem>
                        <MenuItem value="month">Este mês</MenuItem>
                        <MenuItem value="previous">Mês anterior</MenuItem>
                        <MenuItem value="year">Este ano</MenuItem>
                        <MenuItem value="custom">Personalizado</MenuItem>
                      </TextField>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                      <TextField
                        label="De"
                        type="date"
                        value={from}
                        onChange={(event) => {
                          setPreset('custom');
                          setFrom(event.target.value);
                        }}
                        InputLabelProps={{ shrink: true }}
                        disabled={exporting}
                        error={!!dateError}
                      />
                      <TextField
                        label="Até"
                        type="date"
                        value={to}
                        onChange={(event) => {
                          setPreset('custom');
                          setTo(event.target.value);
                        }}
                        InputLabelProps={{ shrink: true }}
                        disabled={exporting}
                        error={!!dateError}
                      />
                    </Box>
                    {dateError ? (
                      <Alert severity="warning">{dateError}</Alert>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        As datas inicial e final são incluídas. Com período definido, registros sem
                        a data escolhida ficam de fora.
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
              <Divider />
              <Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle1">
                    2. Colunas da planilha{' '}
                    <Typography component="span" variant="body2" color="text.secondary">
                      ({columns.length} de {definition.columns.length})
                    </Typography>
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Button
                      size="small"
                      onClick={() => setColumns(definition.columns.map((column) => column.id))}
                      disabled={exporting}
                    >
                      Selecionar todas
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() =>
                        setColumns(
                          definition.columns
                            .filter((column) => column.default)
                            .map((column) => column.id)
                        )
                      }
                      disabled={exporting}
                    >
                      Restaurar padrão
                    </Button>
                  </Stack>
                </Stack>
                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }}
                  gap={2}
                >
                  {groups.map((group) => (
                    <Box
                      key={group}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="overline" color="text.secondary">
                        {group}
                      </Typography>
                      <Stack>
                        {definition.columns
                          .filter((column) => column.group === group)
                          .map((column) => (
                            <FormControlLabel
                              key={column.id}
                              sx={{ m: 0 }}
                              control={
                                <Checkbox
                                  checked={columns.includes(column.id)}
                                  onChange={(_, checked) =>
                                    setColumns(
                                      definition.columns
                                        .filter((option) =>
                                          option.id === column.id
                                            ? checked
                                            : columns.includes(option.id)
                                        )
                                        .map((option) => option.id)
                                    )
                                  }
                                  disabled={exporting}
                                  size="small"
                                />
                              }
                              label={<Typography variant="body2">{column.label}</Typography>}
                            />
                          ))}
                      </Stack>
                    </Box>
                  ))}
                </Box>
                {!columns.length && (
                  <Alert severity="warning" sx={{ mt: 1.5 }}>
                    Selecione pelo menos uma coluna para gerar a planilha.
                  </Alert>
                )}
              </Box>
              <Divider />
              <Box aria-live="polite" aria-busy={loading}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1">3. Confira antes de exportar</Typography>
                  {loading && <CircularProgress size={18} />}
                </Stack>
                {preview && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <strong>{preview.count.toLocaleString('pt-BR')} registro(s)</strong> ·{' '}
                      {columns.length} coluna(s)
                      {!!definition.dates.length && <> · {from ? dateText(from) : 'Sem data inicial'} até {to ? dateText(to) : 'sem data final'}</>}
                    </Typography>
                    {preview.count > preview.limit && (
                      <Alert severity="warning">
                        Refine a busca ou o período para exportar até{' '}
                        {preview.limit.toLocaleString('pt-BR')} registros por arquivo.
                      </Alert>
                    )}
                    {!preview.count && (
                      <Alert severity="info">
                        Nenhum registro encontrado. Ajuste os filtros ou amplie o período.
                      </Alert>
                    )}
                    {!!preview.rows.length && (
                      <>
                        <Box
                          sx={{
                            overflowX: 'auto',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1.5,
                          }}
                        >
                          <Table size="small" aria-label="Prévia da planilha">
                            <TableHead>
                              <TableRow>
                                {selectedColumns.map((column) => (
                                  <TableCell key={column.id} sx={{ whiteSpace: 'nowrap' }}>
                                    {column.label}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {preview.rows.map((row, index) => (
                                <TableRow key={index}>
                                  {selectedColumns.map((column) => (
                                    <TableCell
                                      key={column.id}
                                      sx={{
                                        minWidth: 120,
                                        maxWidth: 280,
                                        overflowWrap: 'anywhere',
                                      }}
                                    >
                                      {previewValue(row[column.id], column)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Prévia de até 5 registros. O arquivo inclui todos os resultados
                          encontrados.
                        </Typography>
                      </>
                    )}
                  </>
                )}
                {!preview && !loading && !error && !dateError && !!columns.length && (
                  <Typography variant="body2" color="text.secondary">
                    Ajuste os filtros para consultar a prévia.
                  </Typography>
                )}
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeSummary}
                    onChange={(_, checked) => setIncludeSummary(checked)}
                    disabled={exporting}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Incluir resumo da exportação</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uma segunda aba com escola, filtros, período e quantidade de registros.
                    </Typography>
                  </Box>
                }
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions disableSpacing sx={{ p: 2.5, gap: 1, flexWrap: 'wrap' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mr: 'auto', flexBasis: { xs: '100%', sm: 'auto' } }}
          aria-live="polite"
        >
          {loading
            ? 'Conferindo registros…'
            : preview && previewKey === JSON.stringify(input)
              ? `${preview.count.toLocaleString('pt-BR')} registro(s) · ${columns.length} coluna(s)`
              : 'Confira os filtros e a prévia.'}
        </Typography>
        <Button
          color="inherit"
          onClick={() => {
            downloadAbort.current?.abort();
            onClose();
          }}
        >
          {exporting ? 'Cancelar geração' : 'Cancelar'}
        </Button>
        <Button
          variant="contained"
          onClick={download}
          disabled={
            !preview?.canExport ||
            previewKey !== JSON.stringify(input) ||
            loading ||
            exporting ||
            !!dateError ||
            !columns.length ||
            !!error
          }
          startIcon={
            exporting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:download-bold" />
            )
          }
        >
          {exporting ? 'Gerando Excel…' : 'Baixar Excel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
