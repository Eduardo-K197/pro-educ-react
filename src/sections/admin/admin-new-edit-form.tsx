import { z as zod } from 'zod';
import { useMemo, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { ProfileFormLayout } from 'src/components/hook-form/profile-form-layout';

import type { AdminDetail } from 'src/types/services/admin';
import { AdminService } from 'src/services/admin';
import { GroupService } from 'src/services/group';
import { SchoolService } from 'src/services/school';

export type NewAdminSchemaType = zod.infer<typeof NewAdminSchema>;

export const NewAdminSchema = zod
  .object({
    avatarUrl: schemaHelper.file({ message: { required_error: 'Avatar is required!' } }).optional().nullable(),
    name: zod.string().min(1, { message: 'Nome obrigatório!' }),
    email: zod
      .string()
      .min(1, { message: 'E-mail obrigatório!' })
      .email({ message: 'Informe um e-mail válido!' }),
    status: zod.string(),
    password: zod.string().optional(),
    passwordConfirmation: zod.string().optional(),
    groups: zod
      .array(zod.object({ id: zod.string(), name: zod.string() }))
      .default([]),
    schools: zod
      .array(zod.object({ id: zod.string(), name: zod.string() }))
      .default([]),
  })
  .refine((data) => {
    if (data.password && data.password !== data.passwordConfirmation) return false;
    return true;
  }, {
    message: 'As senhas não conferem',
    path: ['passwordConfirmation'],
  });

type Props = {
  currentAdmin?: AdminDetail;
};

export function AdminNewEditForm({ currentAdmin }: Props) {
  const router = useRouter();
  const passwordShow = useBoolean();

  const defaultValues = useMemo(
    () => ({
      name: currentAdmin?.name || '',
      email: currentAdmin?.email || '',
      status: currentAdmin?.status || 'active',
      avatarUrl: currentAdmin?.avatarUrl || null,
      password: '',
      passwordConfirmation: '',
      groups: currentAdmin?.groups || [],
      schools: currentAdmin?.schools?.map((s: any) => typeof s === 'string' ? { id: s, name: '' } : s) || [],
    }),
    [currentAdmin]
  );

  const methods = useForm<NewAdminSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewAdminSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const [groupOptions, setGroupOptions] = useState<{ id: string; name: string }[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [groups, schoolsRes] = await Promise.all([
          GroupService.listPagination(),
          SchoolService.list({ hasPagination: false }),
        ]);
        setGroupOptions(groups.map((g: any) => ({ id: g.id, name: g.name })));
        setSchoolOptions((schoolsRes.schools ?? []).map((s: any) => ({ id: s.id, name: s.name })));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar opções', error);
      }
    };

    void loadOptions();
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!currentAdmin && !data.password) {
        toast.error('Senha obrigatória para criar administrador');
        return;
      }

      const payloadBase = {
        name: data.name,
        email: data.email,
        groups: data.groups.map((g) => g.id),
        schools: data.schools.map((s) => s.id),
      };

      if (currentAdmin) {
        await AdminService.update(currentAdmin.id, {
          ...payloadBase,
          ...(data.password
            ? { password: data.password, passwordConfirmation: data.passwordConfirmation }
            : {}),
        });

        toast.success('Administrador atualizado com sucesso!');
      } else {
        await AdminService.create({
          ...payloadBase,
          password: data.password || '',
          passwordConfirmation: data.passwordConfirmation || '',
        });

        toast.success('Administrador cadastrado com sucesso!');
      }

      reset();
      router.push(paths.dashboard.admins.root);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao salvar administrador', error);
      toast.error('Erro ao salvar administrador');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <ProfileFormLayout isEdit={!!currentAdmin} isSubmitting={isSubmitting}>
        <Field.Text name="name" label="Nome" />
        <Field.Text name="email" label="E-mail" InputLabelProps={{ shrink: true }} />

        <Field.Autocomplete
          name="groups"
          label="Grupos"
          placeholder="Selecione os grupos"
          multiple
          disableCloseOnSelect
          options={groupOptions}
          getOptionLabel={(option: any) => option.name}
          isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
        />

        <Field.Autocomplete
          name="schools"
          label="Escolas (acesso direto)"
          placeholder="Selecione as escolas"
          multiple
          disableCloseOnSelect
          options={schoolOptions}
          getOptionLabel={(option: any) => option.name}
          isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
        />

        {/* SENHAS: Visual apenas, para manter o layout correto */}
        <Field.Text
          name="password"
          label={currentAdmin ? 'Nova senha (opcional)' : 'Senha'}
          type={passwordShow.value ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={passwordShow.onToggle} edge="end">
                  <Iconify icon={passwordShow.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Field.Text name="passwordConfirmation" label="Confirmar senha" type={passwordShow.value ? 'text' : 'password'} />
      </ProfileFormLayout>
    </Form>
  );
}
