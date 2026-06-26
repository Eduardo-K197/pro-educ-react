'use client';

import type { AdminListItem } from '@/types/services/admin';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { AdminService } from 'src/services/admin';

// ----------------------------------------------------------------------

export type AdminQuickEditSchemaType = zod.infer<typeof AdminQuickEditSchema>;

export const AdminQuickEditSchema = zod.object({
  name: zod.string().min(1, { message: 'Nome é obrigatório' }),
  email: zod
    .string()
    .min(1, { message: 'E-mail é obrigatório' })
    .email({ message: 'E-mail inválido' }),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentAdmin?: AdminListItem;
  onSuccess?: () => void;
};

export function AdminQuickEditForm({ currentAdmin, open, onClose, onSuccess }: Props) {
  const defaultValues = useMemo(
    () => ({
      name: currentAdmin?.name || '',
      email: currentAdmin?.email || '',
    }),
    [currentAdmin]
  );

  const methods = useForm<AdminQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(AdminQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await AdminService.update(currentAdmin!.id, { name: data.name, email: data.email });
      toast.success('Usuário atualizado com sucesso');
      reset();
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Erro ao atualizar usuário');
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 480 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Edição rápida</DialogTitle>

        <DialogContent>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns="1fr"
            sx={{ pt: 1 }}
          >
            <Field.Text name="name" label="Nome completo" />
            <Field.Text name="email" label="E-mail" />
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
