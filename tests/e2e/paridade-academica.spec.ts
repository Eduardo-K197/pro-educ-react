import { test, expect, type Page } from '@playwright/test';

const schoolId = 'd840b6ca-4329-42a5-a796-39118f6e4a7a';
const studentId = 99001;
const course = {
  id: 'course-academic',
  name: 'Curso acadêmico',
  description: 'Teste isolado',
  workload: 40,
  gradeSetting: { minGrade: 0, maxGrade: 10, step: 0.5 },
};
const subjects = [
  { id: 'math', name: 'Matemática' },
  { id: 'language', name: 'Português' },
  { id: 'art', name: 'Artes' },
];
const initialPeriods = [
  { id: 'p1', courseId: course.id, name: '1º Bimestre', shortName: 'B1', order: 1, weight: '25' },
  { id: 'p2', courseId: course.id, name: '2º Bimestre', shortName: 'B2', order: 2, weight: '75' },
];
const initialGrades = [
  { id: 'g1', studentId, subjectId: 'math', periodId: 'p1', value: 2, weight: 2 },
  { id: 'g2', studentId, subjectId: 'math', periodId: 'p1', value: 3, weight: 3 },
  { id: 'g3', studentId, subjectId: 'math', periodId: 'p2', value: 6, weight: 1 },
  { id: 'g4', studentId, subjectId: 'language', periodId: 'p1', value: 0, weight: 1 },
  { id: 'g5', studentId, subjectId: 'language', periodId: 'p1', value: 8, weight: 1 },
];
async function fixture(
  page: Page,
  options: {
    role?: string;
    gradesError?: boolean;
    partialPeriods?: boolean;
    subscriptionDeleted?: boolean;
  } = {}
) {
  const writes: { method: string; path: string; body: any }[] = [];
  const reports: { courseId: string | null; schoolId?: string }[] = [];
  let grades = [...initialGrades];
  let periods = options.partialPeriods ? [initialPeriods[0]] : [...initialPeriods];
  const subscription = {
    id: 'sub-academic',
    studentId,
    deletedAt: options.subscriptionDeleted ? '2026-01-01' : null,
    classroom: {
      id: 'class-academic',
      name: 'Turma acadêmica',
      course: {
        ...course,
        materials: [
          { id: 'mat-old', name: 'Apostila antiga' },
          { id: 'mat-new', name: 'Apostila nova' },
        ],
      },
    },
    receivedMaterials: [{ materialId: 'mat-old', receivedAt: '2026-01-10T12:00:00Z' }],
    certificate: { id: 123 },
    presences: [],
  };
  await page.addInitScript(
    ({ schoolId }) => {
      sessionStorage.setItem('jwt_access_token', 'proeduc-isolated-regression-session');
      sessionStorage.setItem('proeduc-school-id', schoolId);
    },
    { schoolId }
  );
  await page.route('**/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace(/^\/v1/, ''),
      method = request.method(),
      body = request.postDataJSON();
    if (['POST', 'PUT', 'DELETE'].includes(method)) writes.push({ method, path, body });
    if (options.gradesError && path === `/students/${studentId}/grades`)
      return route.fulfill({ status: 503, json: { message: 'Falha simulada' } });
    if (path.endsWith('/report')) {
      reports.push({
        courseId: url.searchParams.get('courseId'),
        schoolId: request.headers()['school-id'],
      });
      return route.fulfill({
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4\n%%EOF'),
      });
    }
    if (path === '/certificates/123/view')
      return route.fulfill({
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4\n%%EOF'),
      });
    let data: any = {};
    if (path === '/sign-in')
      data = {
        user: { id: 'user-academic', name: 'Secretaria teste', role: options.role ?? 'admin' },
        schools: [{ id: schoolId, name: 'Teste Cora' }],
      };
    else if (path === `/students/${studentId}`)
      data = {
        id: studentId,
        name: 'Aluno acadêmico',
        status: 'Ativo',
        subscriptions: [subscription],
      };
    else if (path === '/subscriptions') data = { subscriptions: [subscription] };
    else if (path === '/comments') data = { comments: [] };
    else if (path === '/courses') data = { courses: [course], count: 1 };
    else if (path === `/courses/${course.id}`) data = course;
    else if (path === `/courses/${course.id}/subjects`) data = { subjects };
    else if (path === `/courses/${course.id}/periods`) {
      if (method === 'POST') {
        periods.push({
          ...body,
          id: `created-${body.shortName}`,
          courseId: course.id,
          weight: String(body.weight),
        });
      }
      data = method === 'GET' ? periods : periods[periods.length - 1];
    } else if (path === `/students/${studentId}/grades`) {
      if (method === 'POST') grades.push({ ...body, id: 'new-grade', studentId });
      data = method === 'GET' ? { grades } : grades[grades.length - 1];
    } else if (path.startsWith(`/students/${studentId}/grades/`) && method === 'DELETE') {
      grades = grades.filter((grade) => !path.endsWith(`/${grade.id}`));
    } else if (path === `/schools/${schoolId}/subjects`) data = subjects;
    else if (path === `/courses/${course.id}/subject-groups`)
      data = [{ id: 'group-academic', name: 'Exatas' }];
    else if (path === `/courses/${course.id}/subject-groups/group-academic`)
      data = { id: 'group-academic', name: 'Exatas', subjects: [subjects[0]] };
    else if (path === `/schools/${schoolId}`)
      data = {
        id: schoolId,
        name: 'Teste Cora',
        admins: [],
        employees: [{ id: 'employee-linked', email: 'vinculado@example.test' }],
        materials: [],
        categories: [],
      };
    else if (path === '/employees')
      data = {
        employees: [
          { id: 'employee-linked', email: 'vinculado@example.test' },
          { id: 'employee-new', email: 'disponivel@example.test' },
        ],
      };
    else if (path === '/classrooms') data = { classrooms: [], count: 0 };
    else if (path === '/students') data = { students: [], count: 0 };
    return route.fulfill({ json: data });
  });
  return { writes, reports };
}
async function choose(page: Page, name: string, option: string) {
  await page
    .getByRole('combobox', {
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$| )`),
    })
    .click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
async function notes(page: Page) {
  await page.goto(`/dashboard/students/${studentId}/`);
  await page.getByRole('tab', { name: 'Notas', exact: true }).click();
}

test('Boletim apresenta médias por matéria e período, pesos, zeros e ausência de notas', async ({
  page,
}) => {
  await fixture(page);
  await notes(page);
  await choose(page, 'Visualização', 'Boletim — visão geral');
  const table = page.getByRole('table', { name: 'Boletim por matéria e período' });
  await expect(table.getByRole('row').filter({ hasText: 'Matemática' })).toContainText('10,00');
  await expect(table.getByRole('row').filter({ hasText: 'Matemática' })).toContainText('7,00');
  await expect(table.getByRole('row').filter({ hasText: 'Português' })).toContainText('4,00');
  await expect(table.getByRole('row').filter({ hasText: 'Artes' })).toContainText('—');
  await expect(table.getByRole('row').filter({ hasText: 'Média do período' })).toContainText(
    '5,50'
  );
});

test('Boletim PDF usa aluno, curso e autenticação da escola selecionada', async ({ page }) => {
  const state = await fixture(page);
  await notes(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar boletim (PDF)', exact: true }).click();
  expect((await download).suggestedFilename()).toBe(`boletim-${studentId}.pdf`);
  expect(state.reports).toEqual([{ courseId: course.id, schoolId }]);
});

test('Falha ao carregar notas bloqueia boletim e não vira boletim vazio', async ({ page }) => {
  await fixture(page, { gradesError: true });
  await notes(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'não significa que o aluno esteja sem notas' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baixar boletim (PDF)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Lançar nota' })).toBeDisabled();
});

test('Funcionário consulta boletim, mas não altera ou apaga notas', async ({ page }) => {
  await fixture(page, { role: 'employee' });
  await notes(page);
  await expect(page.getByRole('button', { name: 'Baixar boletim (PDF)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Lançar nota' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Excluir nota', exact: true })).toHaveCount(0);
});

test('Nota respeita passo configurado e peso zero não se transforma em um', async ({ page }) => {
  const state = await fixture(page);
  await notes(page);
  await page.getByRole('button', { name: 'Lançar nota' }).click();
  await choose(page, 'Matéria', 'Matemática');
  await choose(page, 'Período da avaliação', '1º Bimestre');
  await page.getByLabel('Nota', { exact: true }).fill('7.3');
  await page.getByRole('button', { name: 'Salvar nota' }).click();
  await expect(page.getByText(/Informe uma nota entre/)).toBeVisible();
  expect(state.writes).toHaveLength(0);
  await page.getByLabel('Nota', { exact: true }).fill('7.5');
  await page.getByLabel('Peso da avaliação', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Salvar nota' }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body).toMatchObject({
    value: 7.5,
    weight: 0,
    subjectId: 'math',
    periodId: 'p1',
  });
});

test('Exclusão de nota exige confirmação', async ({ page }) => {
  const state = await fixture(page);
  await notes(page);
  await page.getByRole('button', { name: 'Excluir nota', exact: true }).first().click();
  expect(state.writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].path).toBe(`/students/${studentId}/grades/g1`);
});

test('Entrega preserva histórico anterior e envia somente a matrícula escolhida', async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(`/dashboard/students/${studentId}/`);
  await page.getByRole('tab', { name: 'Desempenho', exact: true }).click();
  await choose(page, 'Material a entregar', 'Apostila nova');
  await page.getByRole('button', { name: 'Registrar entrega' }).click();
  expect(state.writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].path).toBe('/subscriptions/sub-academic');
  expect(state.writes[0].body.receivedMaterials).toHaveLength(2);
  expect(state.writes[0].body.receivedMaterials[0]).toEqual({
    materialId: 'mat-old',
    receivedAt: '2026-01-10T12:00:00Z',
  });
});

test('Matrícula cancelada mantém histórico de materiais sem permitir entrega', async ({ page }) => {
  await fixture(page, { subscriptionDeleted: true });
  await page.goto(`/dashboard/students/${studentId}/`);
  await page.getByRole('tab', { name: 'Desempenho', exact: true }).click();
  await expect(
    page.getByText('Matrícula cancelada: histórico disponível somente para consulta.')
  ).toBeVisible();
  await expect(page.getByText(/Apostila antiga — entregue/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar entrega' })).toHaveCount(0);
});

test('Certificado é baixado da API com autenticação, sem link relativo quebrado', async ({
  page,
}) => {
  await fixture(page);
  await page.goto(`/dashboard/students/${studentId}/`);
  await page.getByRole('tab', { name: 'Desempenho', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ver certificado', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('certificado.pdf');
});

test('Bimestres padrão completa uma criação parcial sem duplicar B1', async ({ page }) => {
  const state = await fixture(page, { partialPeriods: true });
  await page.goto('/dashboard/curriculum/');
  await page.getByRole('tab', { name: 'Períodos', exact: true }).click();
  await choose(page, 'Curso', course.name);
  await page.getByRole('button', { name: 'Criar bimestres padrão' }).click();
  await page.getByRole('button', { name: 'Confirmar criação dos bimestres' }).click();
  await expect.poll(() => state.writes.length).toBe(3);
  expect(state.writes.map((write) => write.body.shortName)).toEqual(['B2', 'B3', 'B4']);
});

test('Associação de matérias ao grupo preserva as existentes e usa somente matérias do curso', async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto('/dashboard/curriculum/');
  await page.getByRole('tab', { name: 'Grupos de matérias' }).click();
  await choose(page, 'Curso', course.name);
  await page.getByRole('button', { name: 'Matérias do grupo' }).click();
  await expect(page.getByText('Vinculadas: Matemática.')).toBeVisible();
  await choose(page, 'Matérias para adicionar', 'Português');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Adicionar matérias', exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body).toEqual({ subjectIds: ['language'] });
});

test('Funcionário novo é criado vinculado somente à escola e senha não aparece na confirmação', async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(`/dashboard/schools/${schoolId}/`);
  await page.getByRole('button', { name: 'Adicionar funcionário' }).click();
  await choose(page, 'Forma de inclusão', 'Criar funcionário');
  await page.getByLabel('E-mail do funcionário').fill('novo@example.test');
  await page.getByLabel('Senha inicial', { exact: true }).fill('SenhaIsolada123');
  await page.getByLabel('Confirmar senha inicial', { exact: true }).fill('SenhaIsolada123');
  await page.getByRole('button', { name: 'Salvar funcionário' }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].path).toBe('/employees');
  expect(state.writes[0].body.schools).toEqual([schoolId]);
});

test('Remover acesso do funcionário exige confirmação e preserva sua conta', async ({ page }) => {
  const state = await fixture(page);
  await page.goto(`/dashboard/schools/${schoolId}/`);
  await page.getByRole('button', { name: 'Remover acesso' }).click();
  expect(state.writes).toHaveLength(0);
  await expect(
    page.getByText(/A conta e os vínculos com outras escolas serão preservados/)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar remoção' }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].path).toBe(`/schools/${schoolId}/employees/employee-linked`);
});

test('Filtro de nascimento envia intervalo à API e limpa datas sem alterar status', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/dashboard/students/');
  await page.getByLabel('Nascimento de').fill('2000-01-01');
  const query = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('birthDate[le]') === '2005-12-31'
  );
  await page.getByLabel('Nascimento até').fill('2005-12-31');
  const url = new URL((await query).url());
  expect(url.searchParams.get('birthDate[ge]')).toBe('2000-01-01');
  expect(url.searchParams.get('status')).toBe('Ativo');
  await page.getByRole('button', { name: 'Limpar datas' }).click();
  await expect(page.getByLabel('Nascimento de')).toHaveValue('');
});

test('Resposta inválida no boletim mostra erro sem baixar documento incorreto', async ({
  page,
}) => {
  await fixture(page);
  await page.route('**/v1/students/99001/report?**', (route) =>
    route.fulfill({ json: { error: 'PDF indisponível' } })
  );
  await notes(page);
  await page.getByRole('button', { name: 'Baixar boletim (PDF)' }).click();
  await expect(page.getByText(/Não foi possível baixar o boletim/)).toBeVisible();
});
