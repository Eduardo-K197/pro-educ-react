import type { IAdminItem } from 'src/types/services/admin';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { ProfileFormLayout } from '@/components/hook-form/profile-form-layout';

export type NewAdminSchemaType = zod.infer<typeof NewAdminSchema>;

export const NewAdminSchema = zod.object({
  avatarUrl: schemaHelper.file({ message: { required_error: 'Avatar is required!' } }).optional().nullable(),
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  status: zod.string(),
  password: zod.string().optional(),
  passwordConfirmation: zod.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.passwordConfirmation) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

type Props = {
  currentAdmin?: IAdminItem;
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      // SIMULAÇÃO (Igual ao do User)
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      reset();
      toast.success(currentAdmin ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.admins.root);
      console.info('DATA', data);
      
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>     
        <ProfileFormLayout
          isEdit={!!currentAdmin}
          isSubmitting={isSubmitting}
        >

        <Field.Text name="name" label="Full name" />
        <Field.Text name="email" label="Email address" />
            
        {/* SENHAS: Visual apenas, para manter o layout correto */}
        <Field.Text
          name="password"
          label={currentAdmin ? "New Password (Optional)" : "Password"}
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

        <Field.Text
          name="passwordConfirmation"
          label="Confirm Password"
          type={passwordShow.value ? 'text' : 'password'}
        />

      </ProfileFormLayout>
    </Form>
  );
}