const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  // AUTH
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      changePassword: `${ROOTS.AUTH}/jwt/change-password`,
    },
  },
  // ÁREA DO ALUNO (ProEduc Learning) — layout próprio, fora do dashboard
  student: {
    root: '/aluno',
    signIn: '/aluno/entrar',
    forgot: '/aluno/esqueci-senha',
    course: (id: string) => `/aluno/cursos/${id}`,
    lesson: (id: string) => `/aluno/aulas/${id}`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    group: {
      root: `${ROOTS.DASHBOARD}/groups`,
      new: `${ROOTS.DASHBOARD}/groups/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/groups/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/groups/${id}`,
    },
    schools: {
      root: `${ROOTS.DASHBOARD}/schools`,
      new: `${ROOTS.DASHBOARD}/schools/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/schools/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/schools/${id}/edit`,
    },
    admins: {
      root: `${ROOTS.DASHBOARD}/admins`,
      new: `${ROOTS.DASHBOARD}/admins/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/admins/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/admins/${id}/edit`,
    },
    webhooks: '/dashboard/webhooks',
    students: {
      root: `${ROOTS.DASHBOARD}/students`,
      new: `${ROOTS.DASHBOARD}/students/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/students/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/students/${id}/edit`,
    },
    growth: {
      root: `${ROOTS.DASHBOARD}/growth`,
      funnel: `${ROOTS.DASHBOARD}/growth/funnel`,
      leads: `${ROOTS.DASHBOARD}/growth/leads`,
      lead: (id: string) => `${ROOTS.DASHBOARD}/growth/leads/${id}`,
      recovery: `${ROOTS.DASHBOARD}/growth/recovery`,
      retention: `${ROOTS.DASHBOARD}/growth/retention`,
      tasks: `${ROOTS.DASHBOARD}/growth/tasks`,
      settings: `${ROOTS.DASHBOARD}/growth/settings`,
    },
    crm: {
      root: `${ROOTS.DASHBOARD}/crm`,
      departments: `${ROOTS.DASHBOARD}/crm/departments`,
      members: `${ROOTS.DASHBOARD}/crm/members`,
      inbox: `${ROOTS.DASHBOARD}/crm/inbox`,
      channels: `${ROOTS.DASHBOARD}/crm/channels`,
      quickReplies: `${ROOTS.DASHBOARD}/crm/quick-replies`,
      tags: `${ROOTS.DASHBOARD}/crm/tags`,
      tickets: `${ROOTS.DASHBOARD}/crm/tickets`,
    },
    learning: {
      root: `${ROOTS.DASHBOARD}/learning`,
      course: (id: string) => `${ROOTS.DASHBOARD}/learning/courses/${id}`,
    },
    intelligence: {
      root: `${ROOTS.DASHBOARD}/intelligence`,
      autoatendimento: `${ROOTS.DASHBOARD}/intelligence/autoatendimento`,
      historico: `${ROOTS.DASHBOARD}/intelligence/historico`,
      conhecimento: `${ROOTS.DASHBOARD}/intelligence/conhecimento`,
    },
    teachers: {
      root: `${ROOTS.DASHBOARD}/teachers`,
      new: `${ROOTS.DASHBOARD}/teachers/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/teachers/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/teachers/${id}/edit`,
    },
    courses: {
      root: `${ROOTS.DASHBOARD}/courses`,
      new: `${ROOTS.DASHBOARD}/courses/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/courses/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/courses/${id}/edit`,
    },
    classrooms: {
      root: `${ROOTS.DASHBOARD}/classrooms`,
      new: `${ROOTS.DASHBOARD}/classrooms/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/classrooms/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/classrooms/${id}/edit`,
    },
    lessons: {
      root: `${ROOTS.DASHBOARD}/lessons`,
      new: `${ROOTS.DASHBOARD}/lessons/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/lessons/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/lessons/${id}/edit`,
    },
    financial: {
      root: `${ROOTS.DASHBOARD}/financial`,
      new: `${ROOTS.DASHBOARD}/financial/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/financial/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/financial/${id}/edit`,
    },
    curriculum: {
      root: `${ROOTS.DASHBOARD}/curriculum`,
    },
  },
};
