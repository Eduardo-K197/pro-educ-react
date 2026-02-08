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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';
import { IGroupItem } from 'src/types/group';

// ----------------------------------------------------------------------

export type GroupQuickAddAdminSchemaType = zod.infer<typeof GroupQuickAddAdminSchema>;

export const GroupQuickAddAdminSchema = zod.object({
  name: zod.string().min(1, { message: 'Nome é obrigatorio!' }),
  email: zod
    .string()
    .min(1, { message: 'Email é obrigatório!!' })
    .email({ message: 'Formato de email inválido!' }),
  password: zod.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres!' }).or(zod.literal('')),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  groupId?: string;
  currentAdmin?: any;    
  onRefresh?: () => void; 
};

export function GroupQuickAddAdmin({ groupId, open, onClose, currentAdmin, onRefresh }: Props) {

  const [showPassword, setShowPassword] = useState(false);

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
      if (currentAdmin) {
        reset({
          name: currentAdmin.name,
          email: currentAdmin.email,
          password: '', 
        });

        const adminGroupIds = currentAdmin.groups?.map((g: any) => g.id) || [];

        const groupsSet = new Set<string>(adminGroupIds);

        if (groupId) {
            groupsSet.add(groupId);
        }

        setSelectedGroups(groupsSet);

      } else {

        reset({ name: '', email: '', password: '' });
        setSelectedGroups(new Set(groupId ? [groupId] : []));
      }
    }
  }, [currentAdmin, open, groupId]);

  const defaultValues = useMemo(
    () => ({
      name: currentAdmin?.name || '',
      email: currentAdmin?.email || '',
      password: '',
    }),
    [currentAdmin]
  );

  const methods = useForm<GroupQuickAddAdminSchemaType>({
    mode: 'all',
    resolver: zodResolver(GroupQuickAddAdminSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleToggleGroup = (id: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroups(newSelected);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {

      const payload: any = {
        name: data.name,
        email: data.email,
        groups: Array.from(selectedGroups),
      };


      if (data.password) {
        payload.password = data.password;
        payload.passwordConfirmation = data.password;
      }

      if (currentAdmin) {

        if (!data.password) {
           delete payload.password;
           delete payload.passwordConfirmation;
        }

        await AdminService.update(currentAdmin.id, payload);
        toast.success('Admin atualizado com sucesso!');

      } else {
        if (!data.password) {
            toast.error('Senha é obrigatória para novos admins');
            return;
        }
        
        await AdminService.create(payload);
        toast.success('Admin criado com sucesso!');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onRefresh) onRefresh();
      
      reset();
      onClose();

    } catch (error) {
      console.error(error);
      toast.error(currentAdmin ? 'Erro ao atualizar admin' : 'Erro ao criar admin');
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{currentAdmin ? 'Editar Admin' : 'Adicionar Novo Admin'}</DialogTitle>

        <DialogContent>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ pt: 1 }}
          >

            <Field.Text name="name" label="Nome Completo" />
            <Field.Text name="email" label="Email" />
            
            <Field.Text
              name="password"
              label={currentAdmin ? "Nova Senha (deixe vazio para manter)" : "Senha"}
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                  return (
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
          </Box>
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