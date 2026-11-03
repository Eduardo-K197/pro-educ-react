'use client';

import type { EntryCategory } from 'src/types/services/entry';
import type { StudentListItem } from 'src/types/services/student';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { localDateString, buildEntryPayload } from 'src/utils/financial';

import { EntryService } from 'src/services/entry';
import { StudentService } from 'src/services/student';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const EntrySchema = zod.object({
  description: zod.string().optional(),
  value: zod.coerce.number().min(0.01, 'Valor obrigatório'),
  dueDate: zod.string().min(1, 'Informe o vencimento'),
  billingType: zod.string().optional(),
  categoryId: zod.string().min(1, 'Selecione uma categoria'),
  studentId: zod.coerce.number().int().positive('Selecione um aluno'),
  installmentCount: zod.coerce.number().int().min(1, 'Informe ao menos uma parcela'),
  discount: zod.coerce.number().min(0).optional(),
  amountMode: zod.string(),
  status: zod.string(),
  paymentDate: zod.string(),
});

type EntryFormValues = zod.infer<typeof EntrySchema>;

export function FinancialCreateView() {
  const router = useRouter();

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [categories, setCategories] = useState<EntryCategory[]>([]);
  const [created, setCreated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [referenceError, setReferenceError] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [linhaDigitavel, setLinhaDigitavel] = useState<string | null>(null);

  useEffect(() => {
    StudentService.list({ hasPagination: false })
      .then((r) => setStudents((r as any).students ?? []))
      .catch(() => setReferenceError(true));
    EntryService.listCategories()
      .then((r) => setCategories(r.categories ?? []))
      .catch(() => setReferenceError(true));
  }, []);

  const methods = useForm<EntryFormValues>({
    resolver: zodResolver(EntrySchema),
    defaultValues: {
      description: '',
      value: 0,
      dueDate: '',
      billingType: 'MONEY',
      categoryId: '',
      studentId: 0,
      installmentCount: 1,
      discount: 0,
      amountMode: 'installment',
      status: 'PENDING',
      paymentDate: localDateString(),
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const amountMode = watch('amountMode');
  const billingType = watch('billingType');
  const manualStatus = watch('status');
  const usesGateway = billingType === 'BOLETO';

  const onSubmit = handleSubmit(async (data) => {
    if (created || referenceError) return;
    try {
      const payload = buildEntryPayload({ ...data, billingType: data.billingType ?? 'MONEY', discount: data.discount ?? 0 });

      let result: any;
      if (usesGateway) {
        result = await EntryService.createPayment(payload);
        setProcessing(!!result?.processing);
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

      setCreated(true);
      toast.success(result?.processing ? 'Carnê em processamento. Acompanhe os pagamentos na ficha do aluno.' : 'Lançamento criado com sucesso!');

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
                {referenceError && <Alert severity="error">Não foi possível carregar alunos ou categorias. Atualize a página antes de salvar.</Alert>}
                {created && <Alert severity="success">{processing ? 'Carnê em processamento. Não envie outra cobrança para o mesmo aluno; acompanhe o resultado na ficha dele.' : 'Lançamento criado. Volte ao Financeiro para consultar o resultado.'}</Alert>}
                <Field.Text name="description" label="Descrição" />
                {usesGateway && <Field.Select name="amountMode" label="O valor informado representa"><MenuItem value="installment">Valor de cada parcela</MenuItem><MenuItem value="total">Valor total do carnê</MenuItem></Field.Select>}

                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="value" label={usesGateway ? amountMode === 'total' ? "Valor total (R$) *" : "Valor de cada parcela (R$) *" : "Valor (R$) *"} type="number" inputProps={{ min: 0.01, step: 0.01 }} />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="discount" label="Desconto por pontualidade (R$)" type="number" inputProps={{ min: 0, step: 0.01 }} />
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

                <Field.Select name="categoryId" label="Categoria *">
                  <MenuItem value="">Selecione a categoria</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Field.Select>

                <Field.Select name="studentId" label="Aluno *">
                  <MenuItem value={0}>Selecione o aluno</MenuItem>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Field.Select>

                {usesGateway && <Field.Text name="installmentCount" label="Número de parcelas *" type="number" inputProps={{ min: 1, step: 1 }} helperText={amountMode === 'total' ? 'O total será dividido em parcelas iguais, sem arredondamento silencioso.' : 'O valor informado será cobrado em cada parcela mensal.'} />}
                {!usesGateway && <Field.Select name="status" label="Situação do lançamento">
                  <MenuItem value="PENDING">Pendente</MenuItem>
                  <MenuItem value="RECEIVED_IN_CASH">Já recebido</MenuItem>
                </Field.Select>}
                {!usesGateway && manualStatus === 'RECEIVED_IN_CASH' && <Field.Text name="paymentDate" label="Data do recebimento *" type="date" InputLabelProps={{ shrink: true }} />}
                {!usesGateway && <Alert severity="info">Este lançamento registra um pagamento manual. Nenhuma cobrança bancária ou chave PIX será emitida.</Alert>}
                {usesGateway && (
                  <Alert severity="info">
                    {billingType === 'BOLETO'
                      ? 'O boleto ou carnê será solicitado ao banco. A geração de carnês pode levar alguns minutos.'
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
                <LoadingButton fullWidth type="submit" variant="contained" color="primary" loading={isSubmitting} disabled={created || referenceError}>
                  {usesGateway ? 'Gerar cobrança' : 'Criar lançamento'}
                </LoadingButton>
                <Button fullWidth variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.financial.root)}>
                  {created ? 'Voltar ao Financeiro' : 'Cancelar'}
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Form>
    </DashboardContent>
  );
}
