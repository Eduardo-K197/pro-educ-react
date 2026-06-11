'use client';

import type {
  SchoolDetail,
  SchoolCreatePayload,
  SchoolUpdatePayload,
  PaymentProvider,
} from 'src/types/services/school';

import { z as zod } from 'zod';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider as RHFFormProvider, Controller } from 'react-hook-form';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import LoadingButton from '@mui/lab/LoadingButton';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { SchoolService } from 'src/services/school';
import { CoraService } from 'src/services/cora';

// ----------------------------------------------------------------------

const SchoolSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
  paymentProvider: zod.enum(['asaas', 'cora']),
  asaasToken: zod.string().optional(),
  asaasSandboxMode: zod.boolean().optional(),
  asaasHomologationMode: zod.boolean().optional(),
  materialsText: zod.string().optional(),
  categoriesText: zod.string().optional(),
});

type SchoolFormValues = zod.infer<typeof SchoolSchema>;

type Props = {
  currentSchool?: SchoolDetail;
};

// ----------------------------------------------------------------------

function parseUniqueLines(value: string) {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);
}

function mapItemsPreservingId(
  names: string[],
  currentItems?: { id: string; name: string }[]
) {
  const byName = new Map(
    (currentItems ?? []).map((item) => [item.name.trim().toLowerCase(), item.id])
  );
  return names.map((name) => ({ id: byName.get(name.trim().toLowerCase()), name }));
}

// ----------------------------------------------------------------------

export function SchoolNewEditForm({ currentSchool }: Props) {
  const router = useRouter();
  const isEdit = !!currentSchool;

  // Cora setup local state
  const [coraSetupOpen, setCoraSetupOpen] = useState(false);
  const [coraLoading, setCoraLoading] = useState(false);
  const [coraClientId, setCoraClientId] = useState('');
  const [coraAccountName, setCoraAccountName] = useState('');
  const [coraEnvironment, setCoraEnvironment] = useState<'homolog' | 'production'>('production');
  const certRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const currentProvider: PaymentProvider =
    currentSchool?.paymentProvider ?? 'asaas';
  const coraConfigured = !!currentSchool?.coraAccount?.clientId;

  const defaultValues = useMemo<SchoolFormValues>(
    () => ({
      name: currentSchool?.name ?? '',
      paymentProvider: currentProvider,
      asaasToken: currentSchool?.asaasToken ?? '',
      asaasSandboxMode: currentSchool?.asaasSandboxMode ?? false,
      asaasHomologationMode: currentSchool?.asaasHomologationMode ?? false,
      materialsText: currentSchool?.materials?.map((m) => m.name).join('\n') ?? '',
      categoriesText: currentSchool?.categories?.map((c) => c.name).join('\n') ?? '',
    }),
    [currentSchool, currentProvider]
  );

  const methods = useForm<SchoolFormValues>({
    resolver: zodResolver(SchoolSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    watch,
    control,
    formState: { isSubmitting },
    register,
  } = methods;

  const provider = watch('paymentProvider');
  const sandbox = watch('asaasSandboxMode') ?? false;
  const homolog = watch('asaasHomologationMode') ?? false;

  useEffect(() => {
    if (currentSchool) reset(defaultValues);
  }, [currentSchool, defaultValues, reset]);

  // ── Salvar escola (Asaas) ──────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values) => {
    const materialNames = parseUniqueLines(values.materialsText ?? '');
    const categoryNames = parseUniqueLines(values.categoriesText ?? '');

    try {
      if (isEdit && currentSchool) {
        const payload: SchoolUpdatePayload = {
          name: values.name,
          ...(values.paymentProvider === 'asaas' && {
            asaasToken: values.asaasToken || undefined,
            asaasSandboxMode: values.asaasSandboxMode,
          }),
          materials: mapItemsPreservingId(materialNames, currentSchool.materials),
          categories: mapItemsPreservingId(categoryNames, currentSchool.categories),
        };
        await SchoolService.update(currentSchool.id, payload);
        toast.success('Escola atualizada!');
      } else {
        const payload: SchoolCreatePayload = {
          name: values.name,
          asaasHomologationMode: values.asaasHomologationMode ?? false,
          ...(values.paymentProvider === 'asaas' && {
            asaasToken: values.asaasToken || undefined,
            asaasSandboxMode: values.asaasSandboxMode,
          }),
          defaultMaterials: materialNames.map((n) => ({ name: n })),
          categories: categoryNames.map((n) => ({ name: n })),
        };
        await SchoolService.create(payload);
        toast.success('Escola criada!');
      }

      router.push(paths.dashboard.schools.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar escola');
    }
  });

  // ── Configurar Cora ───────────────────────────────────────────────────
  const handleCoraSetup = async () => {
    const certFile = certRef.current?.files?.[0];
    const keyFile = keyRef.current?.files?.[0];

    if (!certFile || !keyFile) {
      toast.error('Selecione o certificado (.pem) e a chave privada (.key)');
      return;
    }

    if (!coraClientId || !coraAccountName) {
      toast.error('Preencha o Client ID e o nome da conta Cora');
      return;
    }

    const schoolId = currentSchool?.id;
    const schoolName = watch('name')?.trim();

    if (!schoolId && !schoolName) {
      toast.error('Preencha o nome da escola antes de configurar a Cora');
      return;
    }

    try {
      setCoraLoading(true);

      const materialNames = parseUniqueLines(watch('materialsText') ?? '');
      const categoryNames = parseUniqueLines(watch('categoriesText') ?? '');

      await CoraService.setup({
        schoolId,
        schoolName: schoolId ? undefined : schoolName,
        clientId: coraClientId,
        environment: coraEnvironment,
        accountName: coraAccountName,
        certificate: certFile,
        privateKey: keyFile,
        categories: categoryNames.map((n) => ({ name: n })),
        defaultMaterials: materialNames.map((n) => ({ name: n })),
      });

      toast.success('Cora configurada com sucesso!');
      router.push(paths.dashboard.schools.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao configurar Cora');
    } finally {
      setCoraLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3}>
          {/* Col principal */}
          <Grid xs={12} md={8}>
            <Stack spacing={3}>
              {/* Dados básicos */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {isEdit ? 'Editar escola' : 'Nova escola'}
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    {...register('name')}
                    label="Nome da escola *"
                    fullWidth
                    size="small"
                    error={!!methods.formState.errors.name}
                    helperText={methods.formState.errors.name?.message}
                  />
                </Stack>
              </Card>

              {/* Provedor de pagamento */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Provedor de pagamentos
                </Typography>

                <Controller
                  name="paymentProvider"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      exclusive
                      value={field.value}
                      onChange={(_, v) => { if (v) field.onChange(v); }}
                      size="small"
                      sx={{ mb: 3 }}
                    >
                      <ToggleButton value="asaas">
                        <Iconify icon="mdi:bank-outline" sx={{ mr: 1 }} />
                        Asaas
                      </ToggleButton>
                      <ToggleButton value="cora">
                        <Iconify icon="mdi:bank" sx={{ mr: 1 }} />
                        Banco Cora
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />

                {/* ── Asaas ── */}
                {provider === 'asaas' && (
                  <Stack spacing={2}>
                    <TextField
                      {...register('asaasToken')}
                      label="Token do Asaas"
                      fullWidth
                      size="small"
                      placeholder="$aact_..."
                    />

                    <Stack direction="row" spacing={3}>
                      <Controller
                        name="asaasSandboxMode"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />}
                            label={field.value ? 'Sandbox ativado' : 'Sandbox desativado'}
                          />
                        )}
                      />

                      {!isEdit && (
                        <Controller
                          name="asaasHomologationMode"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={<Switch checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />}
                              label={field.value ? 'Homologação ativada' : 'Homologação desativada'}
                            />
                          )}
                        />
                      )}
                    </Stack>
                  </Stack>
                )}

                {/* ── Cora ── */}
                {provider === 'cora' && (
                  <Stack spacing={2}>
                    {coraConfigured && !coraSetupOpen ? (
                      <>
                        <Alert
                          severity="success"
                          action={
                            <Button size="small" onClick={() => setCoraSetupOpen(true)}>
                              Reconfigurar
                            </Button>
                          }
                        >
                          <AlertTitle>Cora configurada</AlertTitle>
                          Conta: <strong>{currentSchool?.coraAccount?.name}</strong> •{' '}
                          Ambiente:{' '}
                          <Chip
                            size="small"
                            label={currentSchool?.coraAccount?.environment === 'production' ? 'Produção' : 'Homologação'}
                            color={currentSchool?.coraAccount?.environment === 'production' ? 'success' : 'warning'}
                          />
                        </Alert>
                      </>
                    ) : (
                      <>
                        {!coraConfigured && (
                          <Alert severity="info">
                            Para ativar o Banco Cora, preencha os dados abaixo e faça upload do
                            certificado e chave privada fornecidos pelo banco.
                          </Alert>
                        )}

                        <Stack spacing={2}>
                          <Grid container spacing={2}>
                            <Grid xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Client ID *"
                                value={coraClientId}
                                onChange={(e) => setCoraClientId(e.target.value)}
                              />
                            </Grid>
                            <Grid xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Nome da conta *"
                                value={coraAccountName}
                                onChange={(e) => setCoraAccountName(e.target.value)}
                              />
                            </Grid>
                          </Grid>

                          <FormControl size="small" fullWidth>
                            <InputLabel>Ambiente</InputLabel>
                            <Select
                              value={coraEnvironment}
                              label="Ambiente"
                              onChange={(e) => setCoraEnvironment(e.target.value as 'homolog' | 'production')}
                            >
                              <MenuItem value="production">Produção</MenuItem>
                              <MenuItem value="homolog">Homologação</MenuItem>
                            </Select>
                          </FormControl>

                          <Stack spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              Certificado (.pem) *
                            </Typography>
                            <input
                              type="file"
                              accept=".pem,.crt"
                              ref={certRef}
                              style={{ fontSize: 13 }}
                            />
                          </Stack>

                          <Stack spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              Chave privada (.key) *
                            </Typography>
                            <input
                              type="file"
                              accept=".key,.pem"
                              ref={keyRef}
                              style={{ fontSize: 13 }}
                            />
                          </Stack>
                        </Stack>
                      </>
                    )}
                  </Stack>
                )}
              </Card>

              {/* Materiais e Categorias */}
              <Card sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">Materiais padrão</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Um material por linha.
                    </Typography>
                    <TextField
                      {...register('materialsText')}
                      multiline
                      minRows={3}
                      fullWidth
                      size="small"
                      placeholder="Apostila&#10;Caneta&#10;Caderno"
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Typography variant="subtitle1">Categorias financeiras</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uma categoria por linha.
                    </Typography>
                    <TextField
                      {...register('categoriesText')}
                      multiline
                      minRows={3}
                      fullWidth
                      size="small"
                      placeholder="Mensalidade&#10;Material&#10;Uniforme"
                    />
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          </Grid>

          {/* Col lateral (ações) */}
          <Grid xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={() => router.push(paths.dashboard.schools.root)}
                  disabled={isSubmitting || coraLoading}
                >
                  Cancelar
                </Button>

                {provider === 'cora' && (!coraConfigured || coraSetupOpen) ? (
                  <LoadingButton
                    fullWidth
                    variant="contained"
                    loading={coraLoading}
                    onClick={handleCoraSetup}
                    startIcon={<Iconify icon="mdi:bank" />}
                  >
                    {coraConfigured ? 'Reconfigurar Cora' : 'Configurar Cora'}
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    fullWidth
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    startIcon={<Iconify icon="solar:disk-bold" />}
                  >
                    {isEdit ? 'Salvar alterações' : 'Cadastrar escola'}
                  </LoadingButton>
                )}
              </Stack>

              {isEdit && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                  Troca de Cora → Asaas ou vice-versa requer nova configuração.
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>
      </form>
    </RHFFormProvider>
  );
}
