'use client';

import type {
  SchoolDetail,
  SchoolCreatePayload,
  SchoolUpdatePayload,
} from 'src/types/services/school';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider as RHFFormProvider } from 'react-hook-form';

import { Card, Grid, Stack, Button, Divider, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import { SchoolService } from 'src/services/school';

// aqui só os componentes RHF do projeto
import { RHFSwitch, RHFTextField } from 'src/components/hook-form';

const SchoolSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
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

  function parseUniqueLines(value: string) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (value, index, array) =>
          array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index
      );
  }

  function mapItemsPreservingId(names: string[], currentItems?: { id: string; name: string }[]) {
    const byName = new Map(
      (currentItems || []).map((item) => [item.name.trim().toLowerCase(), item.id])
    );

    return names.map((name) => ({
      id: byName.get(name.trim().toLowerCase()),
      name,
    }));
  }

  const onSubmit = handleSubmit(async (values) => {
    const materialNames = parseUniqueLines(values.materialsText || '');
    const categoryNames = parseUniqueLines(values.categoriesText || '');

    try {
      if (currentSchool) {
        // UPDATE
        const payload: SchoolUpdatePayload = {
          name: values.name,
          asaasToken: values.asaasToken || undefined,
          asaasSandboxMode: values.asaasSandboxMode,
          materials: mapItemsPreservingId(materialNames, currentSchool.materials),
          categories: mapItemsPreservingId(categoryNames, currentSchool.categories),
        };

        await SchoolService.update(currentSchool.id, payload);
      } else {
        // CREATE
        const payload: SchoolCreatePayload = {
          name: values.name,
          asaasHomologationMode: values.asaasHomologationMode,
          ...(values.asaasHomologationMode
            ? {}
            : {
                asaasToken: values.asaasToken || undefined,
                asaasSandboxMode: values.asaasSandboxMode,
              }),
          defaultMaterials: materialNames.map((name) => ({ name })),
          categories: categoryNames.map((name) => ({ name })),
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
            <Typography variant="h6">{currentSchool ? 'Editar escola' : 'Nova escola'}</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <RHFTextField name="name" label="Nome" />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField name="asaasToken" label="Token do Asaas" />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <RHFSwitch
                  name="asaasSandboxMode"
                  label={sandbox ? 'Sandbox do Asaas ativado' : 'Sandbox do Asaas desativado'}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                {!currentSchool && (
                  <RHFSwitch
                    name="asaasHomologationMode"
                    label={homolog ? 'Modo homologação ativado' : 'Modo homologação desativado'}
                  />
                )}
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle1">Materiais padrão</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Um material por linha. Na edição, manteremos os IDs quando possível — itens removidos serão deletados e os novos criados.
            </Typography>

            <RHFTextField name="materialsText" label="Materiais" multiline minRows={3} />

            <Divider />

            <Typography variant="subtitle1">Categorias</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Uma categoria por linha.
            </Typography>

            <RHFTextField name="categoriesText" label="Categorias" multiline minRows={3} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router.push(paths.dashboard.schools.root)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>

              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {currentSchool ? 'Salvar alterações' : 'Cadastrar escola'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </form>
    </RHFFormProvider>
  );
}
