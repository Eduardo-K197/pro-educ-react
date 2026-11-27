'use client';

import type { CrmDeal, CrmStudentOption } from 'src/types/services/crm-deal';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { GrowthService } from 'src/services/growth';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { CRM_DEAL_PREFILL_PARAM } from './deal-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  deal: CrmDeal;
  onConverted: (deal: CrmDeal) => void;
  /** Marca como ganho sem vincular aluno (ex.: arrastou para "Matriculado"). */
  onWonWithoutStudent?: () => Promise<void> | void;
};

/**
 * Conversão em matrícula. O cadastro do aluno usa SEMPRE a tela oficial (que
 * cuida de gateway de pagamento, responsável e turmas): o lead só é marcado
 * como ganho depois que o aluno existe — novo (tela pré-preenchida) ou já
 * cadastrado (vínculo direto).
 */
export function CrmDealConvertDialog({ open, onClose, deal, onConverted, onWonWithoutStudent }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CrmStudentOption[]>([]);
  const [selected, setSelected] = useState<CrmStudentOption | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setQuery(deal.studentName ?? '');
  }, [open, deal.studentName]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setOptions([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      GrowthService.searchStudentsForDeal(query.trim())
        .then(setOptions)
        .catch(() => setOptions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [open, query]);

  const link = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await GrowthService.convertDeal(deal.id, selected.id);
      toast.success(`Lead convertido: ${selected.name}.`);
      onConverted(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível converter o lead.');
    } finally {
      setSaving(false);
    }
  };

  const newStudent = () => router.push(`${paths.dashboard.students.new}?${CRM_DEAL_PREFILL_PARAM}=${deal.id}`);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Converter em matrícula</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="subtitle2">Aluno novo</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Abre o cadastro de aluno com os dados do lead preenchidos. Ao salvar, o lead vai para a etapa de ganho e fica ligado ao aluno. Depois é só
            incluir o aluno na turma pela ficha dele.
          </Typography>
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={newStudent} sx={{ alignSelf: 'flex-start' }}>
            Cadastrar aluno com os dados do lead
          </Button>

          <Divider />

          <Typography variant="subtitle2">Aluno já cadastrado</Typography>
          <Autocomplete
            options={options}
            value={selected}
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            inputValue={query}
            onInputChange={(_e, v) => setQuery(v)}
            onChange={(_e, v) => setSelected(v)}
            renderOption={(props, o) => (
              <li {...props} key={o.id}>
                <Stack>
                  <Typography variant="body2">{o.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {[o.status, o.birthDate ? `nasc. ${fDate(o.birthDate)}` : null, o.guardianName ? `resp. ${o.guardianName}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Stack>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Buscar aluno" placeholder="Nome, CPF ou responsável" />}
            noOptionsText={query.trim().length < 2 ? 'Digite ao menos 2 letras' : 'Nenhum aluno encontrado'}
          />
          {deal.convertedStudentId && <Alert severity="info">Este lead já está ligado a um aluno.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {onWonWithoutStudent && (
          <Button color="inherit" onClick={onWonWithoutStudent} sx={{ mr: 'auto' }}>
            Só marcar como ganho
          </Button>
        )}
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" color="success" disabled={!selected} loading={saving} onClick={link}>
          Vincular e marcar ganho
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
