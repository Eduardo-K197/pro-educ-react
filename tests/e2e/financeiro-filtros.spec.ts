import { mergeFinancialEntries } from '../../src/utils/financial';
import { test, expect, type Page } from '@playwright/test';

const schoolId = 'd840b6ca-4329-42a5-a796-39118f6e4a7a';
const course = { id: 'course-journey', name: 'Curso de teste', workload: 40, description: 'Fixture', gradeSetting: { minGrade: 0, maxGrade: 10, step: 0.5 } };
const students = [
  { id: 99101, name: 'Ana Ativa', cpf: '11111111111', status: 'Ativo', email: 'ana@example.test', phoneNumber: '81999990000' },
  { id: 99102, name: 'Ana Inativa', cpf: '22222222222', status: 'Inativo', email: 'inativa@example.test' },
];
async function setup(page: Page, options: { role?: string; summaryError?: boolean; listError?: boolean } = {}) {
  const requests: { path: string; query: URLSearchParams }[] = [];
  await page.addInitScript(({ id }) => { sessionStorage.setItem('jwt_access_token', 'proeduc-isolated-journey-session'); sessionStorage.setItem('proeduc-school-id', id); }, { id: schoolId });
  await page.route('**/v1/**', async (route) => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace(/^\/v1/, '');
    requests.push({ path, query: url.searchParams });
    if (request.method() !== 'GET') throw new Error('As jornadas desta suíte são somente de leitura.');
    if (options.summaryError && path === '/payments') return route.fulfill({ status: 503, json: { message: 'Falha simulada' } });
    if (options.listError && path === '/students') return route.fulfill({ status: 503, json: { message: 'Falha simulada' } });
    const student = students.find((item) => path === `/students/${item.id}`);
    let data: any = {};
    if (path === '/sign-in') data = { user: { id: 'journey-user', name: 'Secretaria', role: options.role ?? 'admin' }, schools: [{ id: schoolId, name: 'Teste Cora', paymentProvider: 'cora' }] };
    else if (path === '/students') {
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';
      const status = url.searchParams.get('status');
      const list = options.role === 'teacher' ? students : students.filter((item) => (!status || item.status === status) && (!search || item.name.toLowerCase().includes(search) || item.cpf.includes(search)));
      data = { students: list, count: list.length };
    }
    else if (student) data = { ...student, subscriptions: [{ id: `sub-${student.id}`, classroom: { id: 'class-journey', name: 'Turma de teste', course } }] };
    else if (path === '/courses') data = { courses: [course], count: 1 };
    else if (path === `/courses/${course.id}`) data = course;
    else if (path.endsWith('/subjects')) data = { subjects: [{ id: 'subject-journey', name: 'Português' }] };
    else if (path.endsWith('/periods')) data = [{ id: 'period-journey', courseId: course.id, name: '1º Bimestre', shortName: 'B1', order: 1, weight: 25 }];
    else if (/\/students\/\d+\/grades/.test(path)) data = { grades: [] };
    else if (path === '/teachers') data = { teachers: [], count: 0 };
    else if (path === '/classrooms') data = { classrooms: [], count: 0 };
    else if (path === '/subscriptions') data = { subscriptions: [] };
    else if (path === '/comments') data = { comments: [] };
    else if (path === '/entry-categories') data = { categories: [] };
    else if (path === '/payments/cora-jobs/active') data = { active: false };
    else if (path === '/entries' || path === '/payments') data = url.searchParams.has('student') ? { entries: [] } : { entries: [{ id: 'old-entry', description: 'Atraso de período anterior', student: { ...students[0], ...(path === '/entries' ? { guardian: { name: 'Contratante de teste', phoneNumber: '81988887777' } } : {}) }, value: 250, status: 'OVERDUE', source: 'cora', billingType: 'BOLETO', dueDate: '2024-01-01', paymentDate: '2024-02-10', dateCreated: '2023-12-01', category: { id: 'monthly', name: 'Mensalidade' } }] };
    return route.fulfill({ json: data });
  });
  return { requests };
}

test('Filtros financeiros combinam períodos, tipo, categoria e preservam exportação honesta', async ({ page }) => {
  await setup(page);
  await page.goto('/dashboard/financial/?year=all');
  const row = page.getByRole('row').filter({ hasText: 'Atraso de período anterior' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Contratante de teste · 81988887777');
  await expect(row.getByRole('link', { name: 'Abrir cadastro do aluno' })).toHaveAttribute('href', '/dashboard/students/99101/');
  await page.getByPlaceholder('Buscar descrição ou aluno...').fill('Inexistente');
  await expect(row).toHaveCount(0);
  await page.getByPlaceholder('Buscar descrição ou aluno...').fill('Ana Ativa');
  await expect(row).toBeVisible();
  await page.getByLabel('Vencimento de', { exact: true }).fill('2025-01-01');
  await expect(row).toHaveCount(0);
  await page.getByLabel('Vencimento de', { exact: true }).fill('2024-01-01');
  await page.getByLabel('Vencimento até', { exact: true }).fill('2024-01-01');
  await expect(row).toBeVisible();
  await page.getByLabel('Pagamento de', { exact: true }).fill('2024-02-01');
  await page.getByLabel('Pagamento até', { exact: true }).fill('2024-02-29');
  await page.getByLabel('Criação de', { exact: true }).fill('2023-12-01');
  await page.getByLabel('Criação até', { exact: true }).fill('2023-12-31');
  await page.getByRole('combobox', { name: 'Tipo de pagamento' }).click();
  await page.getByRole('option', { name: 'Boleto', exact: true }).click();
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).click();
  await page.getByRole('option', { name: 'Mensalidade', exact: true }).click();
  await expect(row).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar Excel' })).toBeDisabled();
  await page.getByRole('tab', { name: /Recebido/ }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('tab', { name: /Em atraso/ }).click();
  await expect(row).toBeVisible();
  await page.getByLabel('Pagamento até', { exact: true }).fill('2024-01-01');
  await expect(page.getByText('A data inicial deve ser anterior')).toBeVisible();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await page.getByRole('combobox', { name: 'Ano do vencimento' }).click();
  await page.getByRole('option', { name: 'Todos', exact: true }).click();
  await row.getByRole('link', { name: 'Abrir cadastro do aluno' }).click();
  await expect(page).toHaveURL(/students\/99101/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Ativa' })).toBeVisible();
});

test('União preserva contratante apenas para o mesmo aluno e respeita exclusão', () => {
  const original = { id: 'entry', value: 100, student: { id: 1, name: 'Ana', guardian: { name: 'Maria', phoneNumber: '81999990000' } } };
  const updated = { id: 'entry', value: 90, student: { id: 1, name: 'Ana' } };
  const merged = mergeFinancialEntries([original], [updated]);
  expect(merged).toHaveLength(1);
  expect(merged[0].value).toBe(90);
  expect(merged[0].student?.guardian?.phoneNumber).toBe('81999990000');
  expect(mergeFinancialEntries([original], [{ ...updated, student: { id: 2, name: 'Bia' } }])[0].student?.guardian).toBeUndefined();
  expect(mergeFinancialEntries([original], [{ ...updated, deleted: true }])).toHaveLength(0);
});
