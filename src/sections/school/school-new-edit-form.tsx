'use client';

import type {
  SchoolDetail,
  SchoolCreatePayload,
  SchoolUpdatePayload,
} from 'src/types/services/school';

import { z as zod } from 'zod';
import { useForm, FormProvider as RHFFormProvider } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, Grid, Stack, Button, Divider, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { SchoolService } from 'src/services/school';

// aqui só os componentes RHF do projeto
import { RHFSwitch, RHFTextField } from 'src/components/hook-form';

const SchoolSchema = zod.object({
  name: zod.string().min(2, 'Name is required'),
  asaasToken: zod.string().optional(),
  asaasSandboxMode: zod.boolean().optional(),
  asaasHomologationMode: zod.boolean(),
  // campos auxiliares para edição em textarea (um item por linha)
  materialsText: zod.string().optional(),
  categoriesText: zod.string().optional(),
});

export type SchoolFormValues = zod.infer<typeof SchoolSchema>;

type Props = {
  currentSchool?: SchoolDetail;
};

export function SchoolNewEditForm({ currentSchool }: Props) {
  const router = useRouter();

  const defaultValues = useMemo<SchoolFormValues>(
    () => ({
      name: currentSchool?.name || '',
      asaasToken: currentSchool?.asaasToken || '',
      asaasSandboxMode: currentSchool?.asaasSandboxMode ?? false,
      asaasHomologationMode: currentSchool?.asaasHomologationMode ?? false,
      materialsText: currentSchool?.materials?.map((m) => m.name).join('\n') || '',
      categoriesText: currentSchool?.categories?.map((c) => c.name).join('\n') || '',
    }),
    [currentSchool]
  );

  const methods = useForm<SchoolFormValues>({
    resolver: zodResolver(SchoolSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
  } = methods;

  useEffect(() => {
    if (currentSchool) {
      reset(defaultValues);
    }
  }, [currentSchool, defaultValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const materialNames = (values.materialsText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const categoryNames = (values.categoriesText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (currentSchool) {
        // UPDATE
        const payload: SchoolUpdatePayload = {
          name: values.name,
          asaasToken: values.asaasToken || undefined,
          asaasSandboxMode: values.asaasSandboxMode,
          materials: materialNames.map((name) => ({ name })),
          categories: categoryNames.map((name) => ({ name })),
          // admins, employees e groups podem ser adicionados aqui depois
        };

        await SchoolService.update(currentSchool.id, payload);
      } else {
        // CREATE
        const payload: SchoolCreatePayload = {
          name: values.name,
          asaasToken: values.asaasToken || undefined,
          asaasSandboxMode: values.asaasSandboxMode,
          asaasHomologationMode: values.asaasHomologationMode,
          defaultMaterials: materialNames.map((name) => ({ name })),
          categories: categoryNames.map((name) => ({ name })),
          // admins e groups podem ser plugados aqui depois
        };

        await SchoolService.create(payload);
      }

      router.push(paths.dashboard.schools.root);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao salvar escola', error);
    }
  });

  // só pra mudar o texto do label de forma reativa
  const sandbox = watch('asaasSandboxMode') ?? false;
  const homolog = watch('asaasHomologationMode');

  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h6">{currentSchool ? 'Edit school' : 'New school'}</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <RHFTextField name="name" label="Name" />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField name="asaasToken" label="Asaas token" />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <RHFSwitch
                  name="asaasSandboxMode"
                  label={sandbox ? 'Sandbox mode enabled' : 'Sandbox mode disabled'}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFSwitch
                  name="asaasHomologationMode"
                  label={homolog ? 'Homologation mode enabled' : 'Homologation mode disabled'}
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle1">Default materials</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              One material per line. On update, it will overwrite materials.
            </Typography>

            <RHFTextField name="materialsText" label="Materials" multiline minRows={3} />

            <Divider />

            <Typography variant="subtitle1">Categories</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              One category per line.
            </Typography>

            <RHFTextField name="categoriesText" label="Categories" multiline minRows={3} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router.push(paths.dashboard.schools.root)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {currentSchool ? 'Save changes' : 'Create school'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </form>
    </RHFFormProvider>
  );
}
