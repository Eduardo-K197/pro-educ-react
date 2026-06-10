// Each month returned by GET /dashboard/
export interface DashboardMonth {
  month: number;
  totalValueReceived: number;
  totalValuePending: number;
  totalValueOverdue: number;
}

// Aggregated stats built on the frontend from multiple API calls
export interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  classroomCount: number;
  totalPending: number;
  totalOverdue: number;
  totalReceived: number;
  months: DashboardMonth[];
}
