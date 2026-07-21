import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';

import { toast } from 'src/components/snackbar';
import { Form, RHFTextField, RHFSwitch } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { GroupService } from 'src/services/group';
import { SchoolService } from 'src/services/school';
import { IGroupItem } from 'src/types/group';

import type { SchoolCreatePayload, SchoolUpdatePayload } from 'src/types/services/school';

// ----------------------------------------------------------------------

export type GroupQuickAddSchoolSchemaType = zod.infer<typeof GroupQuickAddSchoolSchema>;

export const GroupQuickAddSchoolSchema = zod.object({
  name: zod.string().min(2, 'Nome é obrigatório'),
  asaasToken: zod.string().optional(),
  asaasSandboxMode: zod.boolean().default(false),
  asaasHomologationMode: zod.boolean().default(false),
  materialsText: zod.string().optional(),
  categoriesText: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  groupId?: string;
  linkedSchoolIds?: string[];
  currentSchool?: any;
  onRefresh?: () => void;
};

export function GroupQuickAddSchool({
  groupId,
  linkedSchoolIds = [],
  open,
  onClose,
  currentSchool,
  onRefresh,
}: Props) {
  const isEdit = !!currentSchool;

  // Tab: 0 = vincular existente, 1 = criar nova
  const [tab, setTab] = useState(0);

  // --- Aba: vincular escola existente ---
  const [allSchools, setAllSchools] = useState<{ id: string; name: string }[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  // --- Aba: criar nova escola ---
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [allGroups, setAllGroups] = useState<IGroupItem[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(groupId ? [groupId] : [])
  );

  // Quando abre, busca escolas disponíveis e grupos (para criação sem groupId)
  useEffect(() => {
    if (!open) return;

    setTab(isEdit ? 1 : 0);
    setSearch('');
    setSelectedSchoolId(null);

    // Busca escolas para aba de vincular
    if (!isEdit) {
      setLoadingSchools(true);
      SchoolService.list({ perPage: 200 })
        .then((res) => setAllSchools(res.schools ?? []))
        .catch(() => {})
        .finally(() => setLoadingSchools(false));
    }

    // Busca grupos apenas quando não há groupId pré-definido
    if (!groupId) {
      GroupService.getAll()
        .then((list) => setAllGroups(Array.isArray(list) ? list : (list as any).data ?? []))
        .catch(() => {});
    }
  }, [open, isEdit, groupId]);

  // Preenche form ao editar
  useEffect(() => {
    if (open && currentSchool) {
      const materialsStr =
        currentSchool.defaultMaterials?.map((m: any) => m.name).join('\n') ||
        currentSchool.materials?.map((m: any) => m.name).join('\n') ||
        '';
      const categoriesStr = currentSchool.categories?.map((c: any) => c.name).join('\n') || '';

      reset({
        name: currentSchool.name || '',
        asaasToken: currentSchool.asaasToken || '',
        asaasSandboxMode: currentSchool.asaasSandboxMode || false,
        asaasHomologationMode: currentSchool.asaasHomologationMode || false,
        materialsText: materialsStr,
        categoriesText: categoriesStr,
      });

      const schoolGroupIds = currentSchool.groups?.map((g: any) => g.id) || [];
      const groupsSet = new Set<string>(schoolGroupIds);
      if (groupId) groupsSet.add(groupId);
      setSelectedGroups(groupsSet);
    } else if (open) {
      reset({
        name: '',
        asaasToken: '',
        asaasSandboxMode: false,
        asaasHomologationMode: false,
        materialsText: '',
        categoriesText: '',
      });
      setSelectedGroups(new Set(groupId ? [groupId] : []));
      setCertificateFile(null);
    }
  }, [currentSchool, open, groupId]);

  const defaultValues = useMemo(
    () => ({
      name: currentSchool?.name || '',
      asaasToken: currentSchool?.asaasToken || '',
      asaasSandboxMode: currentSchool?.asaasSandboxMode || false,
      asaasHomologationMode: currentSchool?.asaasHomologationMode || false,
      materialsText: '',
      categoriesText: '',
    }),
    [currentSchool]
  );

  const methods = useForm<GroupQuickAddSchoolSchemaType>({
    mode: 'all',
    resolver: zodResolver(GroupQuickAddSchoolSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const sandbox = watch('asaasSandboxMode');
  const homolog = watch('asaasHomologationMode');

  // Escolas ainda não vinculadas ao grupo
  const availableSchools = useMemo(
    () => allSchools.filter((s) => !linkedSchoolIds.includes(s.id)),
    [allSchools, linkedSchoolIds]
  );

  const filteredSchools = useMemo(() => {
    if (!search.trim()) return availableSchools;
    const q = search.toLowerCase();
    return availableSchools.filter((s) => s.name.toLowerCase().includes(q));
  }, [availableSchools, search]);

  const handleToggleGroup = (id: string) => {
    const next = new Set(selectedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroups(next);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) setCertificateFile(event.target.files[0]);
  };

  // Vincula escola existente ao grupo
  const handleLinkSchool = async () => {
    if (!selectedSchoolId || !groupId) return;
    setLinking(true);
    try {
      const newSchoolIds = [...linkedSchoolIds, selectedSchoolId];
      await GroupService.update(groupId, { schools: newSchoolIds } as any);
      toast.success('Escola vinculada com sucesso!');
      onRefresh?.();
      onClose();
    } catch {
      toast.error('Erro ao vincular escola');
    } finally {
      setLinking(false);
    }
  };

  // Cria nova escola
  const onSubmit = handleSubmit(async (values) => {
    try {
      const materialNames = (values.materialsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const categoryNames = (values.categoriesText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (currentSchool) {
        const updatePayload: SchoolUpdatePayload = {
          name: values.name,
          asaasToken: values.asaasToken,
          asaasSandboxMode: values.asaasSandboxMode,
          categories: categoryNames.map((name) => ({ name })),
          groups: Array.from(selectedGroups),
        };
        await SchoolService.update(currentSchool.id, updatePayload);
        toast.success('Escola atualizada com sucesso!');
      } else {
        const createPayload: SchoolCreatePayload = {
          name: values.name,
          asaasHomologationMode: values.asaasHomologationMode,
          defaultMaterials: materialNames.map((name) => ({ name })),
          categories: categoryNames.map((name) => ({ name })),
          groups: Array.from(selectedGroups),
        };
        if (!values.asaasHomologationMode) {
          createPayload.asaasToken = values.asaasToken;
          createPayload.asaasSandboxMode = values.asaasSandboxMode;
        }
        await SchoolService.create(createPayload);
        toast.success('Escola criada com sucesso!');
      }

      await new Promise((r) => setTimeout(r, 800));
      onRefresh?.();
      reset();
      setCertificateFile(null);
      onClose();
    } catch {
      toast.error(currentSchool ? 'Erro ao atualizar escola' : 'Erro ao criar escola');
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <DialogTitle>{isEdit ? 'Editar Escola' : 'Adicionar Escola'}</DialogTitle>

      {/* Tabs só quando não é edição */}
      {!isEdit && (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Escola existente" />
          <Tab label="Nova escola" />
        </Tabs>
      )}

      {/* ── ABA: vincular existente ── */}
      {tab === 0 && !isEdit && (
        <>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar escola..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {loadingSchools ? (
                <Stack alignItems="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                </Stack>
              ) : filteredSchools.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
                  {availableSchools.length === 0
                    ? 'Todas as escolas já estão vinculadas a este grupo.'
                    : 'Nenhuma escola encontrada.'}
                </Typography>
              ) : (
                <List
                  dense
                  sx={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 0,
                  }}
                >
                  {filteredSchools.map((school, idx) => (
                    <Box key={school.id}>
                      {idx > 0 && <Divider />}
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={selectedSchoolId === school.id}
                          onClick={() =>
                            setSelectedSchoolId(selectedSchoolId === school.id ? null : school.id)
                          }
                          sx={{ borderRadius: 0 }}
                        >
                          <ListItemText primary={school.name} />
                          {selectedSchoolId === school.id && (
                            <Chip
                              size="small"
                              label="Selecionada"
                              color="primary"
                              variant="soft"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <LoadingButton
              variant="contained"
              loading={linking}
              disabled={!selectedSchoolId}
              onClick={handleLinkSchool}
            >
              Vincular
            </LoadingButton>
          </DialogActions>
        </>
      )}

      {/* ── ABA: criar nova escola ── */}
      {(tab === 1 || isEdit) && (
        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
              >
                <RHFTextField name="name" label="Nome da Escola" />
                <RHFTextField name="asaasToken" label="Token Asaas" />
              </Box>

              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
              >
                <RHFSwitch
                  name="asaasSandboxMode"
                  label={sandbox ? 'Sandbox habilitado' : 'Sandbox desabilitado'}
                />
                {!currentSchool && (
                  <RHFSwitch
                    name="asaasHomologationMode"
                    label={homolog ? 'Homologação habilitada' : 'Homologação desabilitada'}
                  />
                )}
              </Box>

              {!currentSchool && (
                <Box>
                  <InputLabel sx={{ mb: 1, fontSize: 14 }}>Enviar certificado</InputLabel>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: (theme) => `1px dashed ${theme.palette.divider}`,
                      bgcolor: (theme) => theme.palette.background.neutral,
                    }}
                  >
                    <Button variant="contained" color="inherit" component="label" size="small">
                      Escolher Arquivo
                      <input hidden type="file" accept=".p12,.pem,.crt" onChange={handleFileChange} />
                    </Button>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200, color: 'text.secondary' }}>
                      {certificateFile ? certificateFile.name : 'Nenhum arquivo selecionado'}
                    </Typography>
                  </Stack>
                </Box>
              )}

              <RHFTextField
                name="categoriesText"
                label="Categorias"
                placeholder="Uma categoria por linha..."
                multiline
                rows={3}
              />

              {/* Seletor de grupos só aparece quando NÃO há groupId pré-definido */}
              {!groupId && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Grupos Vinculados
                  </Typography>
                  <Stack
                    sx={{
                      maxHeight: 220,
                      overflowY: 'auto',
                      border: '1px solid rgba(145, 158, 171, 0.24)',
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    {allGroups.map((group) => (
                      <FormControlLabel
                        key={group.id}
                        control={
                          <Switch
                            checked={selectedGroups.has(group.id)}
                            onChange={() => handleToggleGroup(group.id)}
                          />
                        }
                        label={group.name}
                      />
                    ))}
                    {allGroups.length === 0 && (
                      <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>
                        Carregando grupos...
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Salvar
            </LoadingButton>
          </DialogActions>
        </Form>
      )}
    </Dialog>
  );
}
