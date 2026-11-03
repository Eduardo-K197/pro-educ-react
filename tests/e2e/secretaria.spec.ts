import { test, expect, type Page } from '@playwright/test';

const schoolId = 'd840b6ca-4329-42a5-a796-39118f6e4a7a';
const course = { id: 'course-test', name: 'Curso de teste', description: 'Descrição do curso', workload: 80 };
const teacher = { id: 'teacher-test', name: 'Professora de teste' };
const student = { id: 99001, name: 'Aluno de teste', status: 'Ativo', subscriptions: [] };
const entry = { id: 'entry-test', value: 100, status: 'PENDING', billingType: 'BOLETO', source: 'cora', description: 'Mensalidade de teste', student, dueDate: `${new Date().getFullYear()}-12-10` };

type Options = { financialError?: boolean; entries?: any[]; activeJob?: boolean; capture?: (method: string, path: string, body: any) => void };
async function mockSchool(page: Page, options: Options = {}) {
  await page.addInitScript(({ id }) => {
    sessionStorage.setItem('jwt_access_token', 'proeduc-isolated-regression-session');
    sessionStorage.setItem('proeduc-school-id', id);
  }, { id: schoolId });
  // Every API request is fulfilled locally. No test mutation reaches a real bank or database.
  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/v1/, '');
    const method = request.method();
    const body = request.postDataJSON();
    options.capture?.(method, path, body);
    if (options.financialError && path === '/payments') return route.fulfill({ status: 503, json: { message: 'Indisponibilidade simulada' } });
    let data: any = {};
    if (path === '/sign-in') data = { user: { id: 'user-test', name: 'Secretaria de teste', role: 'admin' }, schools: [{ id: schoolId, name: 'Teste Cora', paymentProvider: 'cora' }] };
    else if (path === '/entries' || path === '/payments') data = { entries: options.entries ?? [entry] };
    else if (path === '/courses') data = { courses: [course], count: 1 };
    else if (path === '/teachers') data = { teachers: [teacher], count: 1 };
    else if (path === '/students') data = { students: [student], count: 1 };
    else if (path === '/classrooms') data = { classrooms: [], count: 0 };
    else if (path === `/students/${student.id}`) data = { ...student, entries: options.entries ?? [entry] };
    else if (path === '/entry-categories') data = { categories: [{ id: 'category-test', name: 'Mensalidade' }] };
    else if (path.includes('/subject-groups')) data = method === 'GET' ? [{ id: 'group-test', name: 'Linguagens' }] : { id: 'group-test', name: body?.name };
    else if (path.endsWith('/periods/reorder')) data = body.order.map((id: string, index: number) => ({ id, name: id === 'p1' ? 'Primeiro período' : 'Segundo período', order: index + 1 }));
    else if (path.endsWith('/periods')) data = [{ id: 'p1', name: 'Primeiro período', order: 1 }, { id: 'p2', name: 'Segundo período', order: 2 }];
    else if (path.endsWith('/grade-setting')) data = { minGrade: 0, maxGrade: 10, step: 0.5 };
    else if (path.endsWith('/subjects')) data = path.startsWith('/schools/') ? [] : { subjects: [] };
    else if (path === '/payments/cora-jobs/active') data = options.activeJob ? { active: true, jobId: 'job-test', processing: true } : { active: false };
    else if (path.startsWith('/payments/cora-jobs/')) data = { jobId: 'job-test', processing: true };
    else if (path === '/subscriptions') data = { subscriptions: [] };
    return route.fulfill({ json: data });
  });
}

async function choose(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$| )`) }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('Financeiro deduplica os mesmos lançamentos e soma números', async ({ page }) => {
  await mockSchool(page, { entries: [{ ...entry, value: '100.00' }] });
  await page.goto('/dashboard/financial/');
  await expect(page.getByRole('row').filter({ hasText: 'Mensalidade de teste' })).toHaveCount(1);
  await expect(page.getByText(/R\$\s*100(?:,00)?/).first()).toBeVisible();
  await expect(page.getByText(/R\$\s*200(?:,00)?/)).toHaveCount(0);
});

test('Falha financeira aparece como indisponibilidade e permite nova tentativa', async ({ page }) => {
  await mockSchool(page, { financialError: true });
  await page.goto('/dashboard/financial/');
  await expect(page.getByRole('alert').filter({ hasText: 'Os totais estão indisponíveis' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});

test('Painel não apresenta saldo zero durante falha de consulta', async ({ page }) => {
  await mockSchool(page, { financialError: true });
  await page.goto('/dashboard/');
  await expect(page.getByRole('alert').filter({ hasText: 'não significa saldo zero' })).toBeVisible();
  await expect(page.getByText(/R\$\s*0(?:,00)?/)).toHaveCount(0);
});

test('Turma exige curso e permite vincular professor', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'POST' && path === '/classrooms') writes.push(body); } });
  await page.goto('/dashboard/classrooms/new/');
  await page.getByLabel('Nome da turma *').fill('Turma de teste');
  await page.getByLabel('Data de início *').fill('2026-11-10');
  await page.getByRole('button', { name: 'Criar turma' }).click();
  await expect(page.getByText('Selecione o curso da turma')).toBeVisible();
  expect(writes).toHaveLength(0);
  await choose(page, 'Curso *', course.name);
  await choose(page, 'Professores da turma', teacher.name);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Criar turma' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ course: course.id, teachers: [teacher.id] });
});

test('Curso envia professores e materiais sem duplicar linhas', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'POST' && path === '/courses') writes.push(body); } });
  await page.goto('/dashboard/courses/new/');
  await page.getByLabel('Nome do curso *').fill('Curso de teste');
  await page.getByLabel('Descrição *').fill('Descrição do curso de teste');
  await page.getByLabel('Carga horária (horas) *').fill('80');
  await page.getByLabel('Materiais do curso').fill('Apostila\nCaderno\nApostila');
  await choose(page, 'Professores', teacher.name);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Criar curso' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ teachers: [teacher.id], materials: [{ name: 'Apostila' }, { name: 'Caderno' }] });
});

test('Grade permite criar grupo de matérias pelo contrato existente', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'POST' && path.endsWith('/subject-groups')) writes.push(body); } });
  await page.goto('/dashboard/curriculum/');
  await page.getByRole('tab', { name: 'Grupos de matérias' }).click();
  await choose(page, 'Curso', course.name);
  await expect(page.getByText('Linguagens', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novo grupo', exact: true }).click();
  await page.getByLabel('Nome do grupo').fill('Ciências da Natureza');
  await page.getByRole('button', { name: 'Salvar grupo' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({ name: 'Ciências da Natureza' });
});

test('Períodos enviam a ordem completa sem trocar de curso durante a gravação', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'PUT' && path.endsWith('/periods/reorder')) writes.push(body); } });
  await page.goto('/dashboard/curriculum/');
  await page.getByRole('tab', { name: 'Períodos', exact: true }).click();
  await choose(page, 'Curso', course.name);
  await page.getByRole('button', { name: 'Mover Primeiro período para baixo' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({ order: ['p2', 'p1'] });
});

test('Form financeiro envia campos aceitos pela API e bloqueia reenvio após sucesso', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'POST' && path === '/payments') writes.push(body); } });
  await page.goto('/dashboard/financial/new/');
  await choose(page, 'Tipo de pagamento', 'Boleto');
  await page.getByLabel('Valor de cada parcela (R$) *').fill('100');
  await page.getByLabel('Data de vencimento').fill('2026-12-10');
  await choose(page, 'Categoria *', 'Mensalidade');
  await choose(page, 'Aluno *', student.name);
  await page.getByLabel('Número de parcelas *').fill('3');
  await page.getByRole('button', { name: 'Gerar cobrança' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ student: student.id, entryCategoryId: 'category-test', installmentCount: 3, installmentValue: 100, paymentType: 'installmentValue', status: 'PENDING' });
  expect(writes[0]).not.toHaveProperty('studentId');
  expect(writes[0]).not.toHaveProperty('categoryId');
  await expect(page.getByRole('button', { name: 'Gerar cobrança' })).toBeDisabled();
});

test('Pagamento recebido não oferece exclusão nem nova confirmação', async ({ page }) => {
  await mockSchool(page, { entries: [{ ...entry, status: 'RECEIVED', traducedStatus: 'Pendente', source: 'proeduc', paymentDate: null }] });
  await page.goto('/dashboard/financial/');
  const row = page.getByRole('row').filter({ hasText: 'Mensalidade de teste' });
  await expect(row.getByText('Pago', { exact: true })).toBeVisible();
  await expect(row.getByText('Data não informada')).toBeVisible();
  await expect(row.getByRole('button', { name: 'Confirmar recebimento' })).toHaveCount(0);
  await row.getByRole('button').last().click();
  await expect(page.getByRole('menuitem', { name: 'Excluir', exact: true })).toHaveCount(0);
});

test('Cancelar parcela na ficha não cancela o carnê inteiro', async ({ page }) => {
  const writes: string[] = [];
  await mockSchool(page, { entries: [{ ...entry, installment: 'carne-test' }, { ...entry, id: 'entry-two', installment: 'carne-test', installmentNumber: 2 }], capture: (method, path) => { if (method === 'DELETE') writes.push(path); } });
  await page.goto(`/dashboard/students/${student.id}/`);
  await page.getByRole('tab', { name: 'Pagamentos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Baixar carnê completo' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar apenas esta parcela' }).first().click();
  await expect(page.getByText(/Apenas esta parcela será cancelada/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes).toEqual(['/entries/entry-test']);
});

test('Job ativo informa andamento e bloqueia nova emissão', async ({ page }) => {
  await mockSchool(page, { activeJob: true });
  await page.goto(`/dashboard/students/${student.id}/`);
  await page.getByRole('tab', { name: 'Pagamentos', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Carnê em processamento' })).toBeVisible();
  await page.getByRole('button', { name: 'Novo lançamento' }).click();
  await expect(page.getByRole('button', { name: 'Salvar', exact: true })).toBeDisabled();
});

test('Editar curso preserva materiais próprios sem reenviar IDs dos materiais gerais da escola', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'PUT' && path === '/courses/course-test') writes.push(body); } });
  await page.route('**/v1/courses/course-test', (route) => route.request().method() === 'GET' ? route.fulfill({ json: {
    ...course, teachers: [teacher], materials: [
      { id: 'shared-material', name: 'Material geral', schoolId, courseId: null },
      { id: 'own-material', name: 'Apostila existente', courseId: course.id, schoolId: null },
    ],
  } }) : route.fallback());
  await page.goto('/dashboard/courses/course-test/edit/');
  await page.getByLabel('Novos materiais do curso').fill('Nova apostila');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].materials).toEqual([{ id: 'own-material', name: 'Apostila existente' }, { name: 'Nova apostila' }]);
  expect(writes[0].teachers).toEqual([teacher.id]);
});

test('PDF individual Sicredi consulta o nosso número e não o ID do carnê', async ({ page }) => {
  const reads: string[] = [];
  await mockSchool(page, { entries: [{ ...entry, source: 'sicredi', payment: '123456789', installment: 'carne-test', bankSlipUrl: 'linha-digitavel-test' }], capture: (method, path) => { if (method === 'GET' && path.startsWith('/installments/')) reads.push(path); } });
  await page.goto(`/dashboard/students/${student.id}/`);
  await page.getByRole('tab', { name: 'Pagamentos', exact: true }).click();
  await page.getByRole('button', { name: 'Baixar boleto PDF', exact: true }).click();
  await expect.poll(() => reads.length).toBe(1);
  expect(reads).toEqual(['/installments/123456789']);
});

test('Valor total do carnê divide centavos exatamente e impede arredondamento silencioso', async ({ page }) => {
  const writes: any[] = [];
  await mockSchool(page, { capture: (method, path, body) => { if (method === 'POST' && path === '/payments') writes.push(body); } });
  await page.goto('/dashboard/financial/new/');
  await choose(page, 'Tipo de pagamento', 'Boleto');
  await choose(page, 'O valor informado representa', 'Valor total do carnê');
  await page.getByLabel('Valor total (R$) *').fill('100');
  await page.getByLabel('Data de vencimento').fill('2026-12-10');
  await choose(page, 'Categoria *', 'Mensalidade'); await choose(page, 'Aluno *', student.name);
  await page.getByLabel('Número de parcelas *').fill('3');
  await page.getByRole('button', { name: 'Gerar cobrança' }).click();
  await expect(page.getByText(/O total não pode ser dividido igualmente em centavos/)).toBeVisible();
  expect(writes).toHaveLength(0);
  await page.getByLabel('Valor total (R$) *').fill('300');
  await page.getByRole('button', { name: 'Gerar cobrança' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ installmentValue: 100, value: 100, installmentCount: 3 });
});
