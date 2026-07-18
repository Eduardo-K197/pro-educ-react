'use client';

import type { StudentDetail } from 'src/types/services/student';

import { z as zod } from 'zod';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { varAlpha } from 'src/theme/styles';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { StudentService } from 'src/services/student';

// ----------------------------------------------------------------------

const StudentSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
  email: zod.string().email('E-mail inválido').optional().or(zod.literal('')),
  phone: zod.string().optional(),
  birthDate: zod.string().optional(),
  gender: zod.string().optional(),
  cpf: zod.string().optional(),
  rg: zod.string().optional(),
  status: zod.string().optional(),
  guardianName: zod.string().optional(),
  guardianPhone: zod.string().optional(),
  guardianEmail: zod.string().optional(),
  guardianRelationship: zod.string().optional(),
  guardianCpf: zod.string().optional(),
  guardianRg: zod.string().optional(),
});

type StudentFormValues = zod.infer<typeof StudentSchema>;

interface AddressFields {
  zipCode: string;
  street: string;
  number: string;
  county: string;   // bairro
  city: string;
  state: string;
  complement: string;
}

const emptyAddress = (): AddressFields => ({
  zipCode: '', street: '', number: '', county: '', city: '', state: '', complement: '',
});

function parseAddressFromApi(raw: any): AddressFields {
  if (!raw) return emptyAddress();
  if (typeof raw === 'string') {
    try { return parseAddressFromApi(JSON.parse(raw)); } catch {}
    return emptyAddress();
  }
  return {
    zipCode: raw.zipCode ?? '',
    street: raw.street ?? '',
    number: raw.number ?? '',
    county: raw.county ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    complement: raw.complement ?? '',
  };
}

// ----------------------------------------------------------------------

interface AddressSectionProps {
  value: AddressFields;
  onChange: (patch: Partial<AddressFields>) => void;
  fetching: boolean;
  onCepBlur: (cep: string) => void;
}

function AddressSection({ value, onChange, fetching, onCepBlur }: AddressSectionProps) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="CEP"
            value={value.zipCode}
            onChange={(e) => onChange({ zipCode: e.target.value })}
            onBlur={(e) => onCepBlur(e.target.value)}
            inputProps={{ maxLength: 9 }}
            InputProps={{
              endAdornment: fetching ? <CircularProgress size={16} /> : null,
            }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Rua"
            value={value.street}
            onChange={(e) => onChange({ street: e.target.value })}
          />
        </Grid>
        <Grid xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label="Número"
            value={value.number}
            onChange={(e) => onChange({ number: e.target.value })}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Bairro"
            value={value.county}
            onChange={(e) => onChange({ county: e.target.value })}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Cidade"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Estado (UF)"
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value })}
            inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
          />
        </Grid>
      </Grid>
      <TextField
        fullWidth
        size="small"
        label="Ponto de referência / Complemento"
        value={value.complement}
        onChange={(e) => onChange({ complement: e.target.value })}
      />
    </Stack>
  );
}

// ----------------------------------------------------------------------

type Props = {
  currentStudent?: StudentDetail;
};

export function StudentNewEditForm({ currentStudent }: Props) {
  const router = useRouter();
  const isEdit = !!currentStudent;

  // --- Photo state ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentStudent?.picture?.url ?? currentStudent?.pictureUrl ?? null);

  // --- Student address state ---
  const [addr, setAddr] = useState<AddressFields>(() =>
    parseAddressFromApi(currentStudent?.address)
  );
  const [fetchingCep, setFetchingCep] = useState(false);

  // --- Guardian address state ---
  const [guardianAddr, setGuardianAddr] = useState<AddressFields>(() =>
    parseAddressFromApi(currentStudent?.guardian?.address)
  );
  const [fetchingGuardianCep, setFetchingGuardianCep] = useState(false);

  const defaultValues = useMemo<StudentFormValues>(
    () => ({
      name: currentStudent?.name ?? '',
      email: currentStudent?.email ?? '',
      phone: currentStudent?.phone ?? '',
      birthDate: currentStudent?.birthDate ? currentStudent.birthDate.substring(0, 10) : '',
      gender: currentStudent?.gender ?? '',
      cpf: currentStudent?.cpf ?? '',
      rg: currentStudent?.rg ?? '',
      status: currentStudent?.status ?? 'active',
      guardianName: currentStudent?.guardian?.name ?? '',
      guardianPhone: currentStudent?.guardian?.phone ?? currentStudent?.guardian?.phoneNumber ?? '',
      guardianEmail: currentStudent?.guardian?.email ?? '',
      guardianRelationship: currentStudent?.guardian?.relationship ?? '',
      guardianCpf: currentStudent?.guardian?.cpf ?? '',
      guardianRg: currentStudent?.guardian?.rg ?? '',
    }),
    [currentStudent]
  );

  const methods = useForm<StudentFormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentStudent) {
      reset(defaultValues);
      setAddr(parseAddressFromApi(currentStudent.address));
      setGuardianAddr(parseAddressFromApi(currentStudent.guardian?.address));
      setPhotoPreview(currentStudent.picture?.url ?? currentStudent.pictureUrl ?? null);
    }
  }, [currentStudent, defaultValues, reset]);

  // --- Photo handlers ---
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  // --- CEP fetch ---
  const fetchCep = useCallback(async (cep: string, target: 'student' | 'guardian') => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    const setter = target === 'student' ? setAddr : setGuardianAddr;
    const setFetching = target === 'student' ? setFetchingCep : setFetchingGuardianCep;
    setFetching(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error('CEP não encontrado'); return; }
      setter((prev) => ({
        ...prev,
        street: data.logradouro ?? prev.street,
        county: data.bairro ?? prev.county,
        city: data.localidade ?? prev.city,
        state: data.uf ?? prev.state,
      }));
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setFetching(false);
    }
  }, []);

  const importAddressToGuardian = () => setGuardianAddr({ ...addr });

  // --- Submit ---
  const onSubmit = handleSubmit(async (data) => {
    try {
      const addressPayload = {
        zipCode: addr.zipCode,
        street: addr.street,
        number: addr.number,
        county: addr.county,
        city: addr.city,
        state: addr.state,
        complement: addr.complement,
      };

      const guardianPayload = data.guardianName
        ? {
            name: data.guardianName,
            phone: data.guardianPhone || undefined,
            phoneNumber: data.guardianPhone || undefined,
            email: data.guardianEmail || undefined,
            relationship: data.guardianRelationship || undefined,
            cpf: data.guardianCpf || undefined,
            rg: data.guardianRg || undefined,
            address: guardianAddr,
          }
        : undefined;

      if (photoFile) {
        const form = new FormData();
        form.append('name', data.name);
        if (data.email) form.append('email', data.email);
        if (data.phone) form.append('phone', data.phone);
        if (data.birthDate) form.append('birthDate', data.birthDate);
        if (data.gender) form.append('gender', data.gender);
        if (data.cpf) form.append('cpf', data.cpf);
        if (data.rg) form.append('rg', data.rg);
        form.append('status', data.status ?? 'active');
        form.append('address', JSON.stringify(addressPayload));
        if (guardianPayload) form.append('guardian', JSON.stringify(guardianPayload));
        form.append('picture', photoFile);

        if (isEdit && currentStudent) {
          await StudentService.updateMultipart(currentStudent.id, form);
          toast.success('Aluno atualizado com sucesso!');
        } else {
          await StudentService.createMultipart(form);
          toast.success('Aluno criado com sucesso!');
        }
      } else {
        const payload = {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          birthDate: data.birthDate || undefined,
          gender: data.gender || undefined,
          cpf: data.cpf || undefined,
          rg: data.rg || undefined,
          address: addressPayload,
          status: data.status ?? 'active',
          guardian: guardianPayload,
        };

        if (isEdit && currentStudent) {
          await StudentService.update(currentStudent.id, payload);
          toast.success('Aluno atualizado com sucesso!');
        } else {
          await StudentService.create(payload);
          toast.success('Aluno criado com sucesso!');
        }
      }

      router.push(paths.dashboard.students.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar aluno');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* ---- Coluna principal ---- */}
        <Grid xs={12} md={8}>
          {/* Foto + dados pessoais */}
          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start" sx={{ mb: 3 }}>
              {/* Photo upload */}
              <Stack alignItems="center" spacing={1}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={photoPreview ?? undefined}
                    onClick={handlePhotoClick}
                    sx={{
                      width: 96,
                      height: 96,
                      cursor: 'pointer',
                      bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.12),
                      color: 'primary.main',
                      fontSize: 32,
                      border: (theme) => `2px dashed ${varAlpha(theme.vars.palette.primary.mainChannel, 0.4)}`,
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    {!photoPreview && (
                      <Iconify icon="solar:camera-add-bold-duotone" width={32} />
                    )}
                  </Avatar>
                  <Tooltip title="Tirar foto (câmera)">
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        bgcolor: 'primary.main',
                        color: 'white',
                        width: 28,
                        height: 28,
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('capture', 'environment');
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Iconify icon="solar:camera-bold" width={14} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                  onClick={(e) => {
                    // remove capture when clicking avatar directly
                    (e.target as HTMLInputElement).removeAttribute('capture');
                  }}
                />

                <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
                  Clique para enviar foto
                </Typography>
              </Stack>

              <Box flex={1}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Dados pessoais
                </Typography>
                <Field.Text name="name" label="Nome completo *" />
              </Box>
            </Stack>

            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="email" label="E-mail" type="email" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="phone" label="Telefone" />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="birthDate" label="Data de nascimento" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Select name="gender" label="Gênero">
                    <MenuItem value="">Selecione</MenuItem>
                    <MenuItem value="male">Masculino</MenuItem>
                    <MenuItem value="female">Feminino</MenuItem>
                    <MenuItem value="other">Outro</MenuItem>
                  </Field.Select>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="cpf" label="CPF" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="rg" label="RG" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }}>
                <Chip label="Endereço" size="small" />
              </Divider>

              <AddressSection
                value={addr}
                onChange={(patch) => setAddr((prev) => ({ ...prev, ...patch }))}
                fetching={fetchingCep}
                onCepBlur={(cep) => fetchCep(cep, 'student')}
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Responsável */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">Responsável financeiro</Typography>
            </Stack>

            <Stack spacing={2}>
              <Field.Text name="guardianName" label="Nome do responsável" />

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="guardianPhone" label="Telefone do responsável" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="guardianEmail" label="E-mail do responsável" />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="guardianCpf" label="CPF do responsável" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="guardianRg" label="RG do responsável" />
                </Grid>
              </Grid>

              <Field.Select name="guardianRelationship" label="Parentesco">
                <MenuItem value="">Selecione</MenuItem>
                <MenuItem value="father">Pai</MenuItem>
                <MenuItem value="mother">Mãe</MenuItem>
                <MenuItem value="guardian">Responsável</MenuItem>
                <MenuItem value="other">Outro</MenuItem>
              </Field.Select>

              <Divider sx={{ my: 1 }}>
                <Chip label="Endereço do responsável" size="small" />
              </Divider>

              <Stack direction="row" justifyContent="flex-end">
                <Button
                  size="small"
                  variant="soft"
                  color="primary"
                  startIcon={<Iconify icon="solar:copy-bold-duotone" width={16} />}
                  onClick={importAddressToGuardian}
                >
                  Importar mesmo endereço do aluno
                </Button>
              </Stack>

              <AddressSection
                value={guardianAddr}
                onChange={(patch) => setGuardianAddr((prev) => ({ ...prev, ...patch }))}
                fetching={fetchingGuardianCep}
                onCepBlur={(cep) => fetchCep(cep, 'guardian')}
              />
            </Stack>
          </Card>
        </Grid>

        {/* ---- Coluna lateral ---- */}
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Status
            </Typography>

            <Field.Select name="status" label="Status do aluno">
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="inactive">Inativo</MenuItem>
              <MenuItem value="suspended">Suspenso</MenuItem>
            </Field.Select>

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <LoadingButton
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                loading={isSubmitting}
              >
                {isEdit ? 'Salvar alterações' : 'Criar aluno'}
              </LoadingButton>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => router.push(paths.dashboard.students.root)}
              >
                Cancelar
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
