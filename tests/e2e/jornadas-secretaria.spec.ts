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
    else if (path === '/entries' || path === '/payments') data = url.searchParams.has('student') ? { entries: [] } : { entries: [{ id: 'old-entry', description: 'Atraso de período anterior', student: students[0], value: 250, status: 'OVERDUE', source: 'cora', billingType: 'BOLETO', dueDate: '2024-01-01' }] };
    return route.fulfill({ json: data });
  });
  return { requests };
}

test('Atendimento de pagamentos encontra inativos e abre a aba certa', async ({ page }) => {
  await setup(page); await page.goto('/dashboard/');
  await page.getByRole('button', { name: 'Pagamentos', exact: true }).click();
  await page.getByLabel('Nome ou CPF do aluno').fill('Ana');
  await page.getByLabel('Nome ou CPF do aluno').press('Enter');
  await expect(page).toHaveURL(/task=payments/);
  await expect(page).toHaveURL(/status=all/);
  const row = page.getByRole('row').filter({ hasText: 'Ana Inativa' });
  await row.getByRole('link', { name: 'Ver pagamentos', exact: true }).click();
  await expect(page).toHaveURL(/99102\/?\?tab=payments/);
  await expect(page.getByRole('tab', { name: 'Pagamentos', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { level: 1, name: 'Ana Inativa' })).toBeVisible();
});

test('Jornada do boletim abre visão geral e preserva a ficha ao trocar visualização', async ({ page }) => {
  await setup(page); await page.goto('/dashboard/');
  await page.getByRole('button', { name: 'Boletim', exact: true }).click();
  await page.getByLabel('Nome ou CPF do aluno').fill('Ana');
  await page.getByRole('button', { name: 'Encontrar aluno' }).click();
  await page.getByRole('row').filter({ hasText: 'Ana Ativa' }).getByRole('link', { name: 'Ver boletim', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Boletim por matéria e período' })).toBeVisible();
  await page.getByRole('combobox', { name: /^Visualização/ }).click();
  await page.getByRole('option', { name: 'Avaliações por período', exact: true }).click();
  await expect(page).toHaveURL(/view=details/);
  await page.getByRole('button', { name: 'Boletim', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Boletim por matéria e período' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('table', { name: 'Boletim por matéria e período' })).toBeVisible();
});

test('Voltar da ficha mantém tarefa, busca e filtro de status', async ({ page }) => {
  await setup(page); await page.goto('/dashboard/students/?task=enrollment&status=all&search=Ana');
  await page.getByRole('row').filter({ hasText: 'Ana Inativa' }).getByRole('link', { name: 'Ver matrículas', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Matrículas', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.goBack();
  await expect(page.getByLabel('Nome ou CPF', { exact: true })).toHaveValue('Ana');
  await expect(page.getByRole('button', { name: 'Matrícula', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('row').filter({ hasText: 'Ana Inativa' })).toBeVisible();
});

test('Buscar aluno não dispara uma consulta por tecla digitada', async ({ page }) => {
  const state = await setup(page); await page.goto('/dashboard/students/');
  await expect(page.getByRole('row').filter({ hasText: 'Ana Ativa' })).toBeVisible();
  const before = state.requests.filter((request) => request.path === '/students').length;
  await page.getByLabel('Nome ou CPF', { exact: true }).fill('22222222222');
  await page.waitForTimeout(400);
  expect(state.requests.filter((request) => request.path === '/students')).toHaveLength(before);
  await page.getByRole('button', { name: 'Buscar alunos' }).click();
  await expect.poll(() => state.requests.filter((request) => request.path === '/students').length).toBeGreaterThan(before);
});

test('Painel mantém busca disponível quando o resumo financeiro falha', async ({ page }) => {
  await setup(page, { summaryError: true }); await page.goto('/dashboard/');
  await expect(page.getByRole('alert').filter({ hasText: 'não significa saldo zero' })).toBeVisible();
  await page.getByLabel('Nome ou CPF do aluno').fill('Ana');
  await page.getByRole('button', { name: 'Encontrar aluno' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Ana Inativa' })).toBeVisible();
});

test('Busca curta informa o problema e devolve foco ao campo', async ({ page }) => {
  await setup(page); await page.goto('/dashboard/');
  const input = page.getByLabel('Nome ou CPF do aluno'); await input.fill('A');
  await page.getByRole('button', { name: 'Encontrar aluno' }).click();
  await expect(page.getByText('Digite pelo menos 2 caracteres para buscar.')).toBeVisible();
  await expect(input).toBeFocused();
});

test('Lista vazia orienta e permite limpar os filtros', async ({ page }) => {
  await setup(page); await page.goto('/dashboard/students/?task=report&status=all&search=Inexistente');
  await expect(page.getByText('Nenhum aluno encontrado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca e filtros' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Ana Inativa' })).toBeVisible();
  await expect(page.getByLabel('Nome ou CPF', { exact: true })).toHaveValue('');
});

test('Falha na lista não é apresentada como cadastro inexistente', async ({ page }) => {
  await setup(page, { listError: true }); await page.goto('/dashboard/students/');
  await expect(page.getByRole('alert').filter({ hasText: 'isso não significa que o cadastro não exista' })).toBeVisible();
  await expect(page.getByText('Nenhum aluno encontrado', { exact: true })).toHaveCount(0);
});

test('Resumo em atraso abre os lançamentos de todos os períodos', async ({ page }) => {
  await setup(page); await page.goto('/dashboard/');
  await page.getByRole('link').filter({ hasText: 'Em atraso' }).click();
  await expect(page).toHaveURL(/year=all/);
  await expect(page.getByRole('row').filter({ hasText: 'Atraso de período anterior' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Em atraso/ })).toHaveAttribute('aria-selected', 'true');
});

test('Docente não consulta o financeiro pelo Painel e busca dentro da sua lista', async ({ page }) => {
  const state = await setup(page, { role: 'teacher' }); await page.goto('/dashboard/');
  await expect(page.getByRole('heading', { name: 'Sua escola em números' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toHaveCount(0);
  expect(state.requests.some((request) => ['/entries', '/payments'].includes(request.path))).toBe(false);
  await page.goto('/dashboard/students/?task=profile&status=all&search=Ana%20Inativa');
  await expect(page.getByRole('row').filter({ hasText: 'Ana Inativa' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Ana Ativa' })).toHaveCount(0);
});

test('Atendimento no celular mantém ações principais sem rolagem horizontal da página', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page); await page.goto('/dashboard/');
  await expect(page.getByRole('button', { name: 'Encontrar aluno' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.goto('/dashboard/students/?task=payments&status=all&search=Ana');
  const link = page.getByRole('row').filter({ hasText: 'Ana Ativa' }).getByRole('link', { name: 'Ver pagamentos', exact: true });
  await expect(link).toBeVisible();
  const box = await link.boundingBox(); expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  const nextPage = await page.getByRole('button', { name: 'Ir para a próxima página' }).boundingBox();
  expect(nextPage!.x + nextPage!.width).toBeLessThanOrEqual(390);
  await link.click();
  await expect(page.getByRole('button', { name: 'Boletim', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
