import { paths } from 'src/routes/paths';

export const STUDENT_TASKS = [
  {
    id: 'profile',
    title: 'Consultar aluno',
    action: 'Abrir ficha',
    tab: 'details',
    icon: 'solar:user-id-bold-duotone',
    description: 'Cadastro, contatos e responsável.',
  },
  {
    id: 'enrollment',
    title: 'Matrícula',
    action: 'Ver matrículas',
    tab: 'enrollment',
    icon: 'solar:calendar-mark-bold-duotone',
    description: 'Turmas e vínculos do aluno.',
  },
  {
    id: 'payments',
    title: 'Pagamentos',
    action: 'Ver pagamentos',
    tab: 'payments',
    icon: 'solar:wallet-bold-duotone',
    description: 'Parcelas, recebimentos e boletos.',
  },
  {
    id: 'report',
    title: 'Boletim',
    action: 'Ver boletim',
    tab: 'notes',
    icon: 'solar:diploma-bold-duotone',
    description: 'Notas, médias e boletim em PDF.',
  },
  {
    id: 'materials',
    title: 'Materiais e certificados',
    action: 'Ver histórico',
    tab: 'performance',
    icon: 'solar:book-bookmark-bold-duotone',
    description: 'Entregas, frequência e certificados.',
  },
] as const;
export type StudentTask = (typeof STUDENT_TASKS)[number]['id'];
export const STUDENT_TABS = ['details', 'enrollment', 'notes', 'payments', 'performance'] as const;
export function studentTask(value?: string | null) {
  return STUDENT_TASKS.find((task) => task.id === value) ?? STUDENT_TASKS[0];
}
export function studentTaskHref(id: string | number, taskId?: string | null) {
  const task = studentTask(taskId);
  const query = new URLSearchParams({ tab: task.tab });
  if (task.id === 'report') query.set('view', 'overview');
  return `${paths.dashboard.students.details(String(id))}?${query}`;
}
export function studentSearchHref(search: string, taskId: string) {
  const query = new URLSearchParams({ task: studentTask(taskId).id, status: 'all' });
  if (search.trim()) query.set('search', search.trim());
  return `${paths.dashboard.students.root}?${query}`;
}
export function studentTabIndex(value?: string | null) {
  const index = STUDENT_TABS.findIndex((tab) => tab === value);
  return index < 0 ? 0 : index;
}
