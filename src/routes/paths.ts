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
