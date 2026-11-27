'use client';

import type { GrowthSettings } from 'src/types/services/crm-deal';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { GrowthService } from 'src/services/growth';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from 'src/sections/crm/crm-access-guard';
import { CrmMemberList } from 'src/sections/crm/view/crm-member-list-view';

import { GrowthPipelineConfig } from './growth-pipeline-config';

// ----------------------------------------------------------------------

export function GrowthSettingsView() {
  const [tab, setTab] = useState('pipeline');
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Configurações do Growth" links={[{ name: 'Growth', href: paths.dashboard.growth.root }, { name: 'Configurações' }]} sx={{ mb: 3 }} />
      <CrmAccessGuard min="gestor">
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab value="pipeline" label="Funil e etapas" />
          <Tab value="rules" label="Recuperação e retenção" />
          <Tab value="team" label="Equipe" />
        </Tabs>
        {tab === 'pipeline' && <GrowthPipelineConfig />}
        {tab === 'rules' && <RulesForm />}
        {tab === 'team' && <Team />}
      </CrmAccessGuard>
    </DashboardContent>
  );
}

const FIELDS: { key: keyof GrowthSettings; label: string; help: string; min: number; max: number }[] = [
  { key: 'stalledDays', label: 'Lead parado após (dias)', help: 'Sem mensagem do contato nem mudança de etapa. Usado na Recuperação.', min: 1, max: 365 },
  { key: 'overdueGraceDays', label: 'Inadimplência após (dias de atraso)', help: 'Cobrança vencida há mais que isso coloca o aluno em risco.', min: 0, max: 90 },
  { key: 'absenceThreshold', label: 'Faltas para entrar em risco', help: 'Faltas não justificadas dentro da janela abaixo.', min: 1, max: 100 },
  { key: 'absenceWindowDays', label: 'Janela de faltas (dias)', help: 'Período considerado para contar as faltas.', min: 7, max: 180 },
];

function RulesForm() {
  const [values, setValues] = useState<GrowthSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    GrowthService.getSettings()
      .then(setValues)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar configurações'));
  }, []);

  if (!values) return null;

  const save = async () => {
    setSaving(true);
    try {
      setValues(await GrowthService.updateSettings(values));
      toast.success('Configurações salvas.');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
        {FIELDS.map((f) => (
          <TextField
            key={f.key}
            type="number"
            label={f.label}
            helperText={f.help}
            value={values[f.key]}
            inputProps={{ min: f.min, max: f.max }}
            onChange={(e) => setValues((v) => (v ? { ...v, [f.key]: Math.round(Number(e.target.value) || 0) } : v))}
          />
        ))}
      </Box>
      <Alert severity="info" sx={{ mt: 3 }}>
        A retenção usa só dados que já existem: cobranças vencidas ligadas ao aluno (financeiro) e faltas lançadas na frequência. Nada é enviado ao aluno
        automaticamente.
      </Alert>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <LoadingButton variant="contained" loading={saving} onClick={save}>
          Salvar
        </LoadingButton>
      </Stack>
    </Card>
  );
}

function Team() {
  const { modules } = useSchoolModules();
  if (modules.crm) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          A equipe é a mesma do ChatFlow (atendimento). Papéis: agente vê os próprios leads; supervisor e gestor veem todos.
        </Typography>
        <Button variant="outlined" component={RouterLink} href={paths.dashboard.crm.members}>
          Gerenciar membros
        </Button>
      </Card>
    );
  }
  return <CrmMemberList embedded />;
}
