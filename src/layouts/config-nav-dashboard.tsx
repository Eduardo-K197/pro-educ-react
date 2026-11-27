import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  user: icon('ic-user'),
  dashboard: icon('ic-dashboard'),
  webhook: icon('ic-webhook'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  invoice: icon('ic-invoice'),
  analytics: icon('ic-analytics'),
};

// ----------------------------------------------------------------------

export const navSuperAdmin = [
  {
    subheader: 'Visão geral',
    items: [
      { title: 'Painel', path: paths.dashboard.root, icon: ICONS.dashboard },
    ],
  },
  {
    subheader: 'Gerenciamento',
    items: [
      {
        title: 'Escolas',
        path: paths.dashboard.schools.root,
        icon: <Iconify icon="mdi:school" />,
      },
      {
        title: 'Usuários',
        path: paths.dashboard.admins.root,
        icon: ICONS.user,
      },
      {
        title: 'Grupos',
        path: paths.dashboard.group.root,
        icon: <Iconify icon="mdi:account-group" />,
      },
      {
        title: 'Webhooks',
        path: paths.dashboard.webhooks,
        icon: ICONS.webhook,
      },
    ],
  },
];

export const navAdmin = [
  {
    subheader: 'Escola',
    items: [
      { title: 'Painel', path: paths.dashboard.root, icon: ICONS.dashboard },
    ],
  },
  {
    subheader: 'Pedagógico',
    items: [
      {
        title: 'Alunos',
        path: paths.dashboard.students.root,
        icon: <Iconify icon="solar:users-group-rounded-bold" />,
      },
      {
        title: 'Professores',
        path: paths.dashboard.teachers.root,
        icon: <Iconify icon="solar:user-id-bold-duotone" />,
      },
      {
        title: 'Cursos',
        path: paths.dashboard.courses.root,
        icon: ICONS.course,
      },
      {
        title: 'Turmas',
        path: paths.dashboard.classrooms.root,
        icon: <Iconify icon="solar:calendar-mark-bold-duotone" />,
      },
      {
        title: 'Aulas',
        path: paths.dashboard.lessons.root,
        icon: <Iconify icon="solar:notebook-bold-duotone" />,
      },
      {
        title: 'Grade Curricular',
        path: paths.dashboard.curriculum.root,
        icon: <Iconify icon="solar:clipboard-list-bold-duotone" />,
      },
    ],
  },
  {
    subheader: 'Gestão',
    items: [
      {
        title: 'Financeiro',
        path: paths.dashboard.financial.root,
        icon: ICONS.banking,
      },
      {
        title: 'CRM',
        path: paths.dashboard.crm.root,
        icon: <Iconify icon="solar:chat-round-dots-bold-duotone" />,
        children: [
          { title: 'Visão geral', path: paths.dashboard.crm.root },
          { title: 'Atendimento', path: paths.dashboard.crm.inbox },
          { title: 'Respostas rápidas', path: paths.dashboard.crm.quickReplies },
          { title: 'Tags', path: paths.dashboard.crm.tags },
          { title: 'Canais', path: paths.dashboard.crm.channels },
          { title: 'Setores', path: paths.dashboard.crm.departments },
          { title: 'Membros', path: paths.dashboard.crm.members },
        ],
      },
      {
        title: 'Growth',
        path: paths.dashboard.growth.root,
        icon: <Iconify icon="solar:graph-up-bold-duotone" />,
        children: [
          { title: 'Funil', path: paths.dashboard.growth.funnel },
          { title: 'Leads', path: paths.dashboard.growth.leads },
          { title: 'Tarefas', path: paths.dashboard.growth.tasks },
          { title: 'Recuperação', path: paths.dashboard.growth.recovery },
          { title: 'Retenção', path: paths.dashboard.growth.retention },
          { title: 'Configurações', path: paths.dashboard.growth.settings },
        ],
      },
    ],
  },
];

// default export mantido para compatibilidade
export const navData = navSuperAdmin;
