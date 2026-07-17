'use client';

import type { EntryCreatePayload, BillingType } from 'src/types/services/entry';
import type { EntryCategory } from 'src/types/services/entry';
import type { StudentListItem } from 'src/types/services/student';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { EntryService } from 'src/services/entry';
import { StudentService } from 'src/services/student';

// ----------------------------------------------------------------------

const EntrySchema = zod.object({
  description: zod.string().optional(),
  value: zod.coerce.number().min(0.01, 'Valor obrigatório'),
  dueDate: zod.string().optional(),
  billingType: zod.string().optional(),
  categoryId: zod.string().optional(),
  studentId: zod.coerce.number().optional().nullable(),
  discount: zod.coerce.number().min(0).optional(),
});

type EntryFormValues = zod.infer<typeof EntrySchema>;

export function FinancialCreateView() {
  const router = useRouter();

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [categories, setCategories] = useState<EntryCategory[]>([]);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [linhaDigitavel, setLinhaDigitavel] = useState<string | null>(null);

  useEffect(() => {
    StudentService.list()
      .then((r) => setStudents((r as any).students ?? []))
      .catch(() => {});
    EntryService.listCategories()
      .then((r) => setCategories(r.categories ?? []))
      .catch(() => {});
  }, []);

  const methods = useForm<EntryFormValues>({
    resolver: zodResolver(EntrySchema),
    defaultValues: {
      description: '',
      value: 0,
      dueDate: '',
      billingType: 'MONEY',
      categoryId: '',
      studentId: null,
      discount: 0,
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const billingType = watch('billingType');
  const usesGateway = billingType === 'BOLETO' || billingType === 'PIX';

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: EntryCreatePayload = {
        description: data.description || undefined,
        value: data.value,
        dueDate: data.dueDate || undefined,
        billingType: (data.billingType as BillingType) || undefined,
        categoryId: data.categoryId || undefined,
        studentId: data.studentId ?? undefined,
        discount: data.discount || undefined,
      };

      let result: any;
      if (usesGateway) {
        result = await EntryService.createPayment(payload);
        if (result?.source === 'sicredi') {
          const linha = result?.bankSlipUrl ?? result?.invoiceUrl;
          if (linha) setLinhaDigitavel(linha);
        } else {
          const url = result?.bankSlipUrl ?? result?.invoiceUrl;
          if (url) {
            setInvoiceUrl(url);
            window.open(url, '_blank');
          }
        }
      } else {
        result = await EntryService.createEntry(payload);
      }

      toast.success('Lançamento criado com sucesso!');

      if (!usesGateway) {
        router.push(paths.dashboard.financial.root);
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao criar lançamento');
    }
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Novo lançamento"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Financeiro', href: paths.dashboard.financial.root },
          { name: 'Novo lançamento' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Form methods={methods} onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Dados do lançamento</Typography>
              <Stack spacing={2}>
                <Field.Text name="description" label="Descrição" />

                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="value" label="Valor (R$) *" type="number" />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="discount" label="Desconto (R$)" type="number" />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="dueDate" label="Data de vencimento" type="date" InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Field.Select name="billingType" label="Tipo de pagamento">
                      <MenuItem value="MONEY">Dinheiro (manual)</MenuItem>
                      <MenuItem value="BOLETO">Boleto</MenuItem>
                      <MenuItem value="PIX">PIX</MenuItem>
                      <MenuItem value="CREDIT_CARD">Cartão</MenuItem>
                    </Field.Select>
                  </Grid>
                </Grid>

                <Field.Select name="categoryId" label="Categoria">
                  <MenuItem value="">Sem categoria</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Field.Select>

                <Field.Select name="studentId" label="Aluno (opcional)">
                  <MenuItem value="">Sem aluno</MenuItem>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Field.Select>

                {usesGateway && (
                  <Alert severity="info">
                    {billingType === 'BOLETO'
                      ? 'Um boleto será gerado e aberto automaticamente após salvar.'
                      : 'Um link PIX será gerado e aberto automaticamente após salvar.'}
                  </Alert>
                )}

                {invoiceUrl && (
                  <Alert
                    severity="success"
                    action={
                      <Button size="small" onClick={() => window.open(invoiceUrl, '_blank')}>
                        Abrir novamente
                      </Button>
                    }
                  >
                    Link da cobrança gerado com sucesso!
                  </Alert>
                )}

                {linhaDigitavel && (
                  <Alert
                    severity="success"
                    action={
                      <Button
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(linhaDigitavel);
                          toast.success('Linha digitável copiada!');
                        }}
                      >
                        Copiar
                      </Button>
                    }
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                      Boleto Sicredi gerado!
                    </Typography>
                    <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                      {linhaDigitavel}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </Card>
          </Grid>

          <Grid xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <LoadingButton fullWidth type="submit" variant="contained" color="primary" loading={isSubmitting}>
                  {usesGateway ? 'Gerar cobrança' : 'Criar lançamento'}
                </LoadingButton>
                <Button fullWidth variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.financial.root)}>
                  Cancelar
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Form>
    </DashboardContent>
  );
}
