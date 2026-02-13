import { z as zod } from 'zod';
import { useMemo, useState, useEffect } from 'react';
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

import { Form, Field } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';
import { SchoolService } from 'src/services/school';

// ----------------------------------------------------------------------

export const GroupQuickCreateSchema = zod.object({
  name: zod.string().min(1, 'O nome do grupo é obrigatório'),
});

export type GroupQuickCreateSchemaType = zod.infer<typeof GroupQuickCreateSchema>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

export function GroupQuickAddGroup ({ open, onClose, onRefresh }: Props) {
  
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [allSchools, setAllSchools] = useState<any[]>([]);

  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());


useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [adminsRes, schoolsRes] = await Promise.all([
            AdminService.list(),
            SchoolService.list({ perPage: 100 }) 
          ]);
          
          const adminsList = (adminsRes as any).admins || (adminsRes as any).data || [];
          const schoolsList = (schoolsRes as any).schools || (schoolsRes as any).data || [];

          setAllAdmins(adminsList);
          setAllSchools(schoolsList);

        } catch (error) {
          console.error('Erro no fetchData:', error);
          toast.error('Erro ao carregar listas');
        }
      };

      fetchData(); 
    }
  }, [open]);

  const defaultValues = useMemo(
    () => ({
      name: '',
    }),
    []
  );

  const methods = useForm<GroupQuickCreateSchemaType>({
    resolver: zodResolver(GroupQuickCreateSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const handleToggleAdmin = (id: string) => {
    const newSelected = new Set(selectedAdmins);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedAdmins(newSelected);
  };

  const handleToggleSchool = (id: string) => {
    const newSelected = new Set(selectedSchools);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedSchools(newSelected);
  };

const onSubmit = handleSubmit(async (data) => {
    try {
      const createPayload = {
        name: data.name,
        admins: Array.from(selectedAdmins),
        schools: Array.from(selectedSchools)
      };

      console.info('1. Criando Grupo:', createPayload);
      
      const newGroup = await GroupService.create(createPayload as any);

      if (newGroup?.id) {
        const hasAdmins = selectedAdmins.size > 0;
        const hasSchools = selectedSchools.size > 0;

        if (hasAdmins || hasSchools) {
           const updatePayload = {
             admins: Array.from(selectedAdmins),
             schools: Array.from(selectedSchools),
           };
           
           await GroupService.update(newGroup.id, updatePayload as any);
        }
      }

      toast.success('Grupo criado com sucesso!');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onRefresh) onRefresh(); 

      reset(); 
      setSelectedAdmins(new Set()); 
      setSelectedSchools(new Set());
      onClose();
      
    } catch (error: any) {
      console.error(error);

      const message = error.response?.data?.message || error.message || 'Erro ao criar grupo';
      toast.error(`Erro: ${message}`);
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Novo Grupo</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            
            <Field.Text name="name" label="Nome do Grupo" />

            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Admins</Typography>
                <Stack 
                    sx={{ 
                        maxHeight: 200, 
                        overflowY: 'auto', 
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1, 
                        p: 1 
                    }}
                >
                    {allAdmins.map((admin) => (
                        <FormControlLabel
                            key={admin.id}
                            control={
                                <Switch
                                    checked={selectedAdmins.has(admin.id)}
                                    onChange={() => handleToggleAdmin(admin.id)}
                                />
                            }
                            label={`${admin.name} | ${admin.email}`}
                        />
                    ))}
                    {allAdmins.length === 0 && <Typography variant="caption" sx={{p:1}}>Nenhum admin encontrado.</Typography>}
                </Stack>
            </Box>

            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Escolas</Typography>
                <Stack 
                    sx={{ 
                        maxHeight: 200, 
                        overflowY: 'auto', 
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1, 
                        p: 1 
                    }}
                >
                    {allSchools.map((school) => (
                        <FormControlLabel
                            key={school.id}
                            control={
                                <Switch
                                    checked={selectedSchools.has(school.id)}
                                    onChange={() => handleToggleSchool(school.id)}
                                />
                            }
                            label={school.name}
                        />
                    ))}
                    {allSchools.length === 0 && <Typography variant="caption" sx={{p:1}}>Nenhuma escola encontrada.</Typography>}
                </Stack>
            </Box>

          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Cancelar</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>Salvar</LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}