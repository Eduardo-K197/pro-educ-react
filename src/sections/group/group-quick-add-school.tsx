import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent'; 
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';

import { toast } from 'src/components/snackbar';
import { Form, RHFTextField, RHFSwitch } from 'src/components/hook-form';

import { GroupService } from 'src/services/group';
import { SchoolService } from 'src/services/school';
import { IGroupItem } from 'src/types/group';

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
  currentSchool?: any;
  onRefresh?: () => void;
};

export function GroupQuickAddSchool({ groupId, open, onClose, currentSchool, onRefresh }: Props) {

  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [allGroups, setAllGroups] = useState<IGroupItem[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(groupId ? [groupId] : []));

  useEffect(() => {
    if (open) {
      const fetchGroups = async () => {
        try {
          const response = await GroupService.getAll();
          const list = Array.isArray(response) ? response : (response as any).data || [];
          setAllGroups(list);
        } catch (error) {
          console.error('Erro ao buscar grupos:', error);
        }
      };
      fetchGroups();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (currentSchool) {
        
        const materialsStr = currentSchool.defaultMaterials?.map((m: any) => m.name).join('\n') || '';
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

      } else {

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

  const handleToggleGroup = (id: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroups(newSelected);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        setCertificateFile(event.target.files[0]);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const materialNames = (values.materialsText || '')
        .split('\n').map((s) => s.trim()).filter(Boolean);

      const categoryNames = (values.categoriesText || '')
        .split('\n').map((s) => s.trim()).filter(Boolean);

      const payload: any = {
        name: values.name,
        asaasToken: values.asaasToken || undefined,
        asaasSandboxMode: values.asaasSandboxMode,
        asaasHomologationMode: values.asaasHomologationMode,
        defaultMaterials: materialNames.map((name) => ({ name })),
        categories: categoryNames.map((name) => ({ name })),
        groups: Array.from(selectedGroups)
      };

      if (currentSchool) {
        await SchoolService.update(currentSchool.id, payload);
        toast.success('Escola atualizada com sucesso!');
      } else {
        await SchoolService.create(payload);
        toast.success('Escola criada com sucesso!');
      }
      
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onRefresh) onRefresh();
      
      reset();
      setCertificateFile(null);
      onClose();

    } catch (error) {
      console.error(error);
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
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{currentSchool ? 'Editar Escola' : 'Adicionar Nova Escola'}</DialogTitle>

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
                <RHFSwitch 
                    name="asaasHomologationMode" 
                    label={homolog ? 'Homologação habilitada' : 'Homologação desabilitada'} 
                />
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
                            bgcolor: (theme) => theme.palette.background.neutral
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
                name="materialsText" 
                label="Materiais Padrão" 
                placeholder="Um material por linha..."
                multiline 
                rows={3} 
            />
            <RHFTextField 
                name="categoriesText" 
                label="Categorias" 
                placeholder="Uma categoria por linha..."
                multiline 
                rows={3} 
            />

            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>Grupos Vinculados</Typography>
              <Stack
                sx={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid rgba(145, 158, 171, 0.24)',
                  borderRadius: 1,
                  p: 1
                }}
              >
                {allGroups.map((group) => {
                  return(
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
                  )
                })}

                {allGroups.length === 0 && (
                    <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>
                        Carregando grupos...
                    </Typography>
                )}

              </Stack>
            </Box>
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
    </Dialog>
  );
}