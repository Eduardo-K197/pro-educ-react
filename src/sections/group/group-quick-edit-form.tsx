import { boolean, z as zod } from 'zod';
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

import { Field, Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';
import { SchoolService } from 'src/services/school';
import { IGroupItem } from 'src/types/group';
import { ISchoolItem } from '@/types/services/school';
import { IAdminItem } from '@/types/services/admin';

// ----------------------------------------------------------------------

export type GroupQuickEditSchemaType = zod.infer<typeof GroupQuickEditSchema>;

export const GroupQuickEditSchema = zod.object({
  name: zod.string().min(1, { message: 'O Nome é obrigatorio!' }),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentGroup: IGroupItem
  onRefresh?: () => void; 
};

export function GroupQuickEdit({ currentGroup, open, onClose, onRefresh }: Props) {

   const [allAdmins, setAllAdmins] = useState<IAdminItem[]>([]);
   const [allSchools, setAllSchools] = useState<ISchoolItem[]>([]);

   const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(
    new Set(currentGroup.groupAdmin?.map(ga => ga.admin?.id).filter(Boolean) as string[])
   );

   const [selectedSchools, setSelectedSchools] = useState<Set<string>>(
    new Set(currentGroup.groupSchool?.map(s => s.school?.id).filter(Boolean) as string[])
   );

   useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try{
          const [adminsRes, schoolsRes] = await Promise.all([
            AdminService.list(),
            SchoolService.list()
          ]);
          
          setAllAdmins(adminsRes.admins);
          setAllSchools(schoolsRes.schools);

        } catch (error) {
          console.error('Erro ao buscar dados:', error);
          toast.error('Erro ao carregar listas.')
        }
      };
      fetchData();
    }
  }, [open]);

  const defaultValues = useMemo(
    () => ({
      name: currentGroup.name || '',
    }),
    [currentGroup]
  );

  const methods = useForm<GroupQuickEditSchemaType>({
    resolver: zodResolver(GroupQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if(currentGroup) {
        reset({name: currentGroup.name});
        setSelectedAdmins(new Set(currentGroup.groupAdmin?.map(ga => ga.admin?.id).filter(Boolean) as string[]));
        setSelectedSchools(new Set(currentGroup.groupSchool?.map(s => s.school?.id).filter(Boolean) as string[]));
    }
  }, [currentGroup, reset]);

  const handleToggleAdmin = (id: string) => {
    const newSelected = new Set(selectedAdmins);
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedAdmins(newSelected)
  }

   const handleToggleSchool = (id: string) => {
    const newSelected = new Set(selectedSchools);
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSchools(newSelected)
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        name: data.name,
        admins: Array.from(selectedAdmins),
        schools: Array.from(selectedSchools)
      };

      await GroupService.update(currentGroup.id, payload)

      toast.success('Grupo atualizado com sucesso!');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onRefresh) onRefresh(); 
      
      reset();
      onClose();
      

    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar grupo')
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Editar Grupo</DialogTitle>

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
                            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                        />
                    ))}
                    {allAdmins.length === 0 && <Typography variant="caption" sx={{ p: 1 }}>Nenhum admin encontrado.</Typography>}
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
                            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                        />
                    ))}
                    {allSchools.length === 0 && <Typography variant="caption" sx={{ p: 1 }}>Nenhuma escola encontrada.</Typography>}
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
