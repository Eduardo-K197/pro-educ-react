'use client';

import { useRef, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CrmAiService } from 'src/services/crm-ai';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { fBytes } from './utils';

// ----------------------------------------------------------------------

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'text/plain'];

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

/** Envio de PDF ou TXT para a base de conhecimento. */
export function KbUploadDialog({ open, onClose, onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setTitle('');
    }
  }, [open]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const okType = ACCEPTED.includes(f.type) || /\.(pdf|txt)$/i.test(f.name);
    if (!okType) {
      toast.error('Envie um arquivo PDF ou TXT');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error('O arquivo passa de 10 MB');
      return;
    }
    setFile(f);
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    try {
      await CrmAiService.uploadDocument(file, title.trim() || undefined);
      toast.success('Arquivo enviado. A indexação foi iniciada.');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar o arquivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Enviar arquivo</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={() => inputRef.current?.click()}
            sx={{ py: 3, borderStyle: 'dashed' }}
          >
            {file ? 'Trocar arquivo' : 'Escolher PDF ou TXT (até 10 MB)'}
          </Button>
          {file && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon={file.type === 'application/pdf' ? 'solar:file-text-bold' : 'solar:document-text-bold'} />
              <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                {file.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {fBytes(file.size)}
              </Typography>
            </Stack>
          )}
          <TextField
            label="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helperText="Em branco, usamos o nome do arquivo."
            inputProps={{ maxLength: 200 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            PDFs escaneados (imagem) não têm texto para extrair. Prefira PDFs gerados a partir de documentos de texto.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={saving} disabled={!file} onClick={save}>
          Enviar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
