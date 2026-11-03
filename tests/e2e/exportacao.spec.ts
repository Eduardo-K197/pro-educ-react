import fs from 'node:fs';
import path from 'node:path';

import { test, expect, type Page } from '@playwright/test';

import catalog from '../fixtures/export-catalog.json';

const schoolId = 'd840b6ca-4329-42a5-a796-39118f6e4a7a';
const sample = fs.readFileSync(path.join(__dirname, '../fixtures/export-sample.xlsx'));
async function setup(page: Page) {
 const state = { previewError: false, optionsError: false, downloadInvalid: false, count: 25, delay: 0, downloads: [] as any[], previews: [] as any[] };
 await page.addInitScript((id) => { sessionStorage.setItem('jwt_access_token', 'isolated-export-session'); sessionStorage.setItem('proeduc-school-id', id); }, schoolId);
 await page.route('**/v1/**', async (route) => {
  const req = route.request(); const url = new URL(req.url()); const endpoint = url.pathname.replace(/^\/v1/, '');
  const match = endpoint.match(/^\/exports\/([^/]+)\/(options|preview|download)$/);
  if (match) {
   expect(req.headers()['school-id']).toBe(schoolId);
   const definition = catalog[match[1] as keyof typeof catalog];
   if (match[2] === 'options') return route.fulfill({ status: state.optionsError ? 404 : 200, json: state.optionsError ? { message: 'Indisponível' } : definition });
   expect(req.method()).toBe('POST'); const body = req.postDataJSON(); expect(body).not.toHaveProperty('page'); expect(body).not.toHaveProperty('perPage'); expect(body).not.toHaveProperty('schoolId');
   if (match[2] === 'download') { state.downloads.push(body); return state.downloadInvalid ? route.fulfill({ json: { message: 'Resposta inválida' } }) : route.fulfill({ contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: sample }); }
   state.previews.push(body); if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
   const row: Record<string, unknown> = { name: 'Ana Teste', status: 'Ativo', birthDate: '2000-01-01', phone: '00123456789', cpf: '00012345678', email: 'ana@example.test', value: 123.45, dueDate: '2026-05-31', description: 'Mensalidade', studentName: 'Ana Teste' };
   return route.fulfill({ status: state.previewError ? 503 : 200, json: state.previewError ? { message: 'Não foi possível consultar os registros.' } : { count: state.count, rows: state.count ? [Object.fromEntries(body.columns.map((id: string) => [id, row[id] ?? null]))] : [], limit: 20000, canExport: state.count > 0 && state.count <= 20000 } });
  }
  if (req.method() !== 'GET') throw new Error(`Mutação fora da exportação: ${endpoint}`);
  if (endpoint === '/sign-in') return route.fulfill({ json: { user: { id: 'export-test-user', name: 'Secretaria', role: 'admin' }, schools: [{ id: schoolId, name: 'Teste Cora', paymentProvider: 'cora' }] } });
  if (endpoint === '/students') return route.fulfill({ json: { students: [{ id: 99101, name: 'Ana Teste', status: 'Ativo' }], count: 25 } });
  if (endpoint === '/entries' || endpoint === '/payments') return route.fulfill({ json: { entries: [{ id: 'export-entry', description: 'Mensalidade', value: 123.45, status: 'PAID', dueDate: '2026-05-31', student: { id: 99101, name: 'Ana Teste' } }] } });
  if (endpoint === '/courses') return route.fulfill({ json: { courses: [], count: 0 } });
  if (endpoint === '/classrooms') return route.fulfill({ json: { classrooms: [], count: 0 } });
  if (endpoint === '/teachers') return route.fulfill({ json: { teachers: [], count: 0 } });
  if (endpoint === '/classes') return route.fulfill({ json: { classes: [], count: 0 } });
  return route.fulfill({ json: {} });
 });
 return state;
}
async function open(page: Page, route = '/dashboard/students/?status=all') {
 await page.goto(route); await page.getByRole('button', { name: 'Exportar Excel', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible();
}

test('Modal prepara colunas padrão e exporta todos os resultados, não somente a página', async ({ page }) => {
 const state = await setup(page); await open(page);
 await expect(page.getByText('25 registro(s)', { exact: true })).toBeVisible();
 await expect(page.getByRole('checkbox', { name: 'CPF', exact: true })).not.toBeChecked();
 await expect(page.getByRole('checkbox', { name: 'Nome', exact: true })).toBeChecked();
 await page.getByRole('checkbox', { name: 'E-mail', exact: true }).uncheck();
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
 const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar Excel', exact: true }).click()]);
 expect(download.suggestedFilename()).toMatch(/^alunos-\d{4}-\d{2}-\d{2}\.xlsx$/);
 const file = fs.readFileSync((await download.path())!); expect(file.equals(sample)).toBe(true);
 expect(state.downloads).toHaveLength(1); expect(state.downloads[0].columns).not.toContain('cpf'); expect(state.downloads[0].columns).not.toContain('email');
});

test('Financeiro inicia com período da lista e permite escolher data do pagamento', async ({ page }) => {
 const state = await setup(page); await open(page, '/dashboard/financial/?status=Pago');
 await expect(page.getByLabel('De', { exact: true })).toHaveValue(`${new Date().getFullYear()}-01-01`);
 await page.getByRole('combobox', { name: /^Data usada no período/ }).click(); await page.getByRole('option', { name: 'Data do pagamento', exact: true }).click();
 await page.getByLabel('De', { exact: true }).fill('2026-05-01'); await page.getByLabel('Até', { exact: true }).fill('2026-05-31');
 await expect.poll(() => state.previews.at(-1)?.to).toBe('2026-05-31');
 expect(state.previews.at(-1)).toMatchObject({ dateField: 'paymentDate', from: '2026-05-01', to: '2026-05-31', status: 'Pago' });
 await page.getByRole('combobox', { name: /^Período/ }).click(); await page.getByRole('option', { name: 'Todo o histórico', exact: true }).click();
 await expect(page.getByLabel('De', { exact: true })).toHaveValue(''); await expect(page.getByLabel('Até', { exact: true })).toHaveValue('');
});

test('Nenhuma coluna selecionada bloqueia o download e restaurar padrão recupera a seleção', async ({ page }) => {
 await setup(page); await open(page); await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
 for (const column of catalog.students.columns.filter((item) => item.default)) await page.getByRole('checkbox', { name: column.label, exact: true }).uncheck();
 await expect(page.getByText('Selecione pelo menos uma coluna para gerar a planilha.')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeDisabled();
 await page.getByRole('button', { name: 'Restaurar padrão', exact: true }).click(); await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
});

test('Intervalo invertido não consulta nem exporta', async ({ page }) => {
 const state = await setup(page); await open(page); await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
 await page.getByLabel('De', { exact: true }).fill('2026-06-02'); await page.getByLabel('Até', { exact: true }).fill('2026-06-01');
 await expect(page.getByText('A data inicial deve ser anterior ou igual à data final.')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeDisabled(); expect(state.downloads).toHaveLength(0);
});

test('Falha na prévia permite nova tentativa sem gerar arquivo nem apresentar falso vazio', async ({ page }) => {
 const state = await setup(page); state.previewError = true; await open(page);
 await expect(page.getByText('Não foi possível consultar os registros.', { exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeDisabled(); expect(state.downloads).toHaveLength(0);
 state.previewError = false; await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
});

test('Opções indisponíveis não viram planilha vazia', async ({ page }) => {
 const state = await setup(page); state.optionsError = true; await open(page);
 await expect(page.getByText('A exportação está indisponível no momento. Tente novamente mais tarde.')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeDisabled(); expect(state.downloads).toHaveLength(0);
});

test('Resposta JSON não é baixada com extensão Excel', async ({ page }) => {
 const state = await setup(page); state.downloadInvalid = true; await open(page); await page.getByRole('button', { name: 'Baixar Excel', exact: true }).click();
 await expect(page.getByText('Não foi possível gerar uma planilha válida. Tente novamente.')).toBeVisible(); await expect(page.getByRole('dialog')).toBeVisible();
});

test('Limite do servidor e lista vazia orientam sem exportar', async ({ page }) => {
 const state = await setup(page); state.count = 20001; await open(page);
 await expect(page.getByText(/Refine a busca ou o período para exportar até/)).toBeVisible(); await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeDisabled();
 state.count = 0; await page.getByLabel('Buscar na exportação').fill('Inexistente');
 await expect(page.getByText('Nenhum registro encontrado. Ajuste os filtros ou amplie o período.')).toBeVisible(); expect(state.downloads).toHaveLength(0);
});

test('Alterar filtro bloqueia download até a nova prévia chegar', async ({ page }) => {
 const state = await setup(page); await open(page); await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
 state.count = 0; state.delay = 700; await page.getByLabel('Buscar na exportação').fill('Novo filtro');
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeDisabled();
 await expect(page.getByText('Nenhum registro encontrado. Ajuste os filtros ou amplie o período.')).toBeVisible();
});

test('Modal cabe no celular e mantém os botões na área visível', async ({ page }) => {
 await page.setViewportSize({ width: 320, height: 844 }); await setup(page); await open(page);
 await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
 expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
 const box = await page.getByRole('button', { name: 'Baixar Excel', exact: true }).boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Exportação está integrada às seis listas e cursos não apresenta período inventado', async ({ page }) => {
 await setup(page);
 for (const resource of ['courses', 'classrooms', 'teachers', 'lessons'] as const) {
  await open(page, `/dashboard/${resource}/`);
  await expect(page.getByRole('button', { name: 'Baixar Excel', exact: true })).toBeEnabled();
  if (resource === 'courses') await expect(page.getByRole('combobox', { name: /^Data usada no período/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 }
});
