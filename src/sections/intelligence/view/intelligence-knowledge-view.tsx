'use client';

import type { CrmAiKbDocument, CrmAiKbSearchResult } from 'src/types/services/crm-ai';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDateTime } from 'src/utils/format-time';

import { CrmAiService } from 'src/services/crm-ai';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { TableNoData, TableHeadCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import {
  CRM_AI_KB_KIND_LABELS,
  CRM_AI_KB_STATUS_LABELS,
  CRM_AI_KB_STATUS_COLORS,
} from 'src/types/services/crm-ai';

import { fInt } from '../utils';
import { KbUploadDialog } from '../kb-upload-dialog';
import { CrmAccessGuard } from '../../crm/crm-access-guard';
import { KbDocumentFormDialog } from '../kb-document-form-dialog';

import type { KbFormTarget } from '../kb-document-form-dialog';

// ----------------------------------------------------------------------

const POLL_MS = 5000;

const TABLE_HEAD = [
  { id: 'title', label: 'Documento' },
  { id: 'status', label: 'Status', width: 130 },
  { id: 'size', label: 'Tamanho', width: 150 },
  { id: 'updatedAt', label: 'Atualizado', width: 150 },
  { id: 'active', label: 'Ativo', width: 90 },
  { id: '', width: 60 },
];

const KIND_ICON: Record<CrmAiKbDocument['kind'], string> = {
  faq: 'solar:question-circle-bold-duotone',
  text: 'solar:document-text-bold-duotone',
  file: 'solar:file-text-bold-duotone',
};

export function IntelligenceKnowledgeView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Base de conhecimento"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Intelligence', href: paths.dashboard.intelligence.root },
          { name: 'Base de conhecimento' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="gestor">
        <Stack spacing={3}>
          <KnowledgeList />
          <SearchTest />
        </Stack>
      </CrmAccessGuard>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function KnowledgeList() {
  const [docs, setDocs] = useState<CrmAiKbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formTarget, setFormTarget] = useState<KbFormTarget | null>(null);
  const [deleting, setDeleting] = useState<CrmAiKbDocument | null>(null);
  const upload = useBoolean();
  const firstLoad = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    firstLoad.current = true;
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    // Recargas do polling são silenciosas (sem barra de progresso).
    if (firstLoad.current) setLoading(true);
    CrmAiService.listDocuments(search)
      .then((data) => !cancelled && setDocs(data))
      .catch((err) => !cancelled && toast.error(err?.message || 'Erro ao carregar a base de conhecimento'))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          firstLoad.current = false;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Enquanto houver documento na fila/indexando, atualiza a cada ~5 s.
  const processing = docs.some((d) => d.status === 'pending' || d.status === 'indexing');
  useEffect(() => {
    if (!processing) return undefined;
    const t = setTimeout(reload, POLL_MS);
    return () => clearTimeout(t);
  }, [processing, docs, reload]);

  const replace = (doc: CrmAiKbDocument) => setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...doc } : d)));

  const toggleActive = async (doc: CrmAiKbDocument, active: boolean) => {
    replace({ ...doc, active });
    try {
      replace(await CrmAiService.updateDocument(doc.id, { active }));
      toast.success(active ? 'Documento ativado' : 'Documento desativado: a IA deixa de consultá-lo');
    } catch (err: any) {
      replace(doc);
      toast.error(err?.message || 'Erro ao alterar o documento');
    }
  };

  const reindex = async (doc: CrmAiKbDocument) => {
    try {
      replace(await CrmAiService.reindexDocument(doc.id));
      toast.success('Reindexação iniciada');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao reindexar');
    }
  };

  const remove = async (doc: CrmAiKbDocument) => {
    try {
      await CrmAiService.deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Documento excluído');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir o documento');
    }
  };

  return (
    <Card>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2.5 }} alignItems={{ md: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por título"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setFormTarget({ kind: 'faq' })}>
            Novo FAQ
          </Button>
          <Button variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setFormTarget({ kind: 'text' })}>
            Novo texto
          </Button>
          <Button variant="contained" startIcon={<Iconify icon="eva:cloud-upload-fill" />} onClick={upload.onTrue}>
            Enviar PDF/TXT
          </Button>
        </Stack>
      </Stack>

      <Divider />
      <Box sx={{ height: 2 }}>{loading && <LinearProgress sx={{ height: 2 }} />}</Box>

      <Scrollbar>
        <TableContainer sx={{ minWidth: 820 }}>
          <Table>
            <TableHeadCustom headLabel={TABLE_HEAD} />
            <TableBody>
              {docs.map((doc) => (
                <KbRow
                  key={doc.id}
                  doc={doc}
                  onEdit={() => setFormTarget({ document: doc })}
                  onToggleActive={(v) => toggleActive(doc, v)}
                  onReindex={() => reindex(doc)}
                  onDelete={() => setDeleting(doc)}
                />
              ))}
              <TableNoData
                notFound={!loading && docs.length === 0}
                title={search ? 'Nenhum documento encontrado' : 'Base de conhecimento vazia'}
                description={
                  search
                    ? 'Tente outro termo.'
                    : 'Cadastre perguntas frequentes, textos ou envie PDFs com as informações que a IA pode usar para responder.'
                }
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {processing && (
        <Typography variant="caption" sx={{ display: 'block', px: 2.5, py: 1.5, color: 'text.secondary' }}>
          Há documentos sendo indexados. A lista se atualiza sozinha.
        </Typography>
      )}

      <KbDocumentFormDialog target={formTarget} onClose={() => setFormTarget(null)} onSaved={reload} />
      <KbUploadDialog open={upload.value} onClose={upload.onFalse} onSaved={reload} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Excluir documento"
        content={
          <>
            Excluir <strong>{deleting?.title}</strong> da base de conhecimento? A IA deixa de consultá-lo e essa ação não
            pode ser desfeita.
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleting) remove(deleting);
              setDeleting(null);
            }}
          >
            Excluir
          </Button>
        }
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

type KbRowProps = {
  doc: CrmAiKbDocument;
  onEdit: () => void;
  onToggleActive: (active: boolean) => void;
  onReindex: () => void;
  onDelete: () => void;
};

function KbRow({ doc, onEdit, onToggleActive, onReindex, onDelete }: KbRowProps) {
  const popover = usePopover();
  const busy = doc.status === 'pending' || doc.status === 'indexing';

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon={KIND_ICON[doc.kind]} width={28} sx={{ color: doc.active ? 'primary.main' : 'text.disabled', flexShrink: 0 }} />
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, cursor: 'pointer' }} noWrap onClick={onEdit}>
                {doc.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                {CRM_AI_KB_KIND_LABELS[doc.kind]}
                {doc.fileName ? ` · ${doc.fileName}` : ''}
              </Typography>
            </Stack>
          </Stack>
        </TableCell>
        <TableCell>
          <Tooltip title={doc.status === 'error' ? doc.error || 'Falha na indexação' : ''}>
            <span>
              <Label
                variant="soft"
                color={CRM_AI_KB_STATUS_COLORS[doc.status]}
                startIcon={busy ? <Iconify icon="eos-icons:loading" width={14} /> : undefined}
              >
                {CRM_AI_KB_STATUS_LABELS[doc.status]}
              </Label>
            </span>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{fInt(doc.chunkCount)} trecho(s)</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {fInt(doc.charCount)} caracteres
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDateTime(doc.updatedAt, 'DD/MM/YYYY HH:mm')}</TableCell>
        <TableCell>
          <Switch size="small" checked={doc.active} onChange={(e) => onToggleActive(e.target.checked)} />
        </TableCell>
        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          <MenuItem
            onClick={() => {
              onEdit();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {doc.kind === 'file' ? 'Ver / renomear' : 'Editar'}
          </MenuItem>
          <MenuItem
            disabled={busy}
            onClick={() => {
              onReindex();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:refresh-bold" />
            Reindexar
          </MenuItem>
          <MenuItem
            onClick={() => {
              onDelete();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Excluir
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

// ----------------------------------------------------------------------

function SearchTest() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CrmAiKbSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const value = q.trim();
    if (!value) return;
    setLoading(true);
    try {
      setResults(await CrmAiService.search(value));
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao testar a busca');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1">Testar busca</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Escreva uma pergunta como uma família escreveria e veja quais trechos a IA encontraria para responder.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          placeholder="Ex.: até que horas a secretaria funciona?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              run();
            }
          }}
        />
        <LoadingButton variant="contained" loading={loading} disabled={!q.trim()} onClick={run} startIcon={<Iconify icon="eva:search-fill" />}>
          Buscar
        </LoadingButton>
      </Stack>

      {results && (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {!results.length && (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Nenhum trecho encontrado. Cadastre a informação na base ou verifique se os documentos estão ativos e prontos.
            </Typography>
          )}
          {results.map((r, i) => (
            <Box key={r.chunkId} sx={{ p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>
                  {i + 1}. {r.title}
                </Typography>
                <Tooltip title="Relevância (quanto maior, mais parecido com a pergunta)">
                  <Label variant="soft" color="info">
                    {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(r.score)}
                  </Label>
                </Tooltip>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'text.secondary' }}>
                {r.text}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}
