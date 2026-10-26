import axios from 'axios';

export const API_URL = 'http://localhost:8000';

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: unknown } | undefined;
      if (typeof first?.msg === 'string') return first.msg;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const client = axios.create({ baseURL: `${API_URL}/company` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CompanyProfile {
  id: string;
  name: string;
  rif: string;
  sector: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface CompanySummary {
  company_name: string;
  departments: number;
  employees: number;
  active_employees: number;
  courses_assigned: number;
  completion_rate: number;
}

export interface ActivityItem {
  id: string;
  user_name: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  employee_count: number;
  courses_assigned: number;
  average_progress: number;
}

export type ContentType = 'video' | 'quiz' | 'mixed';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface CourseClass {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  has_evaluation: boolean;
  content_type: ContentType;
  is_required: boolean;
  position: number;
}

export interface QuizOptionAdmin {
  id?: string;
  text: string;
  is_correct: boolean;
  position?: number;
}

export interface QuizQuestionAdmin {
  id?: string;
  prompt: string;
  question_type: QuestionType;
  points: number;
  explanation: string | null;
  position: number;
  options: QuizOptionAdmin[];
}

export interface QuizAdmin {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  show_answers_after_submit: boolean;
  is_published: boolean;
  questions: QuizQuestionAdmin[];
}

export interface QuizUpsertPayload {
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  show_answers_after_submit: boolean;
  is_published: boolean;
  questions: {
    prompt: string;
    question_type: QuestionType;
    points: number;
    explanation: string | null;
    position: number;
    options: { text: string; is_correct: boolean }[];
  }[];
}

export interface AdminQuizAttempt {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  classes: CourseClass[];
}

export interface CourseWithClasses {
  id: string;
  title: string;
  image_url: string | null;
  modules: CourseModule[];
}

export interface CompanyUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CompanyUserPayload {
  full_name: string;
  email: string;
  password?: string;
  department_id?: string | null;
  role: 'company_admin' | 'user';
  is_active?: boolean;
}

export interface DepartmentPayload {
  name: string;
  description?: string | null;
}

export interface ClassPayload {
  module_id?: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  duration_minutes?: number | null;
  has_evaluation?: boolean;
  content_type?: ContentType;
  is_required?: boolean;
  position?: number;
}

export const companyApi = {
  getProfile: () => client.get<CompanyProfile>('/profile').then((r) => r.data),
  getSummary: () => client.get<CompanySummary>('/summary').then((r) => r.data),
  getActivity: (limit = 10) =>
    client.get<ActivityItem[]>('/activity', { params: { limit } }).then((r) => r.data),

  listDepartments: () => client.get<Department[]>('/departments').then((r) => r.data),
  createDepartment: (payload: DepartmentPayload) =>
    client.post<Department>('/departments', payload).then((r) => r.data),
  updateDepartment: (id: string, payload: DepartmentPayload) =>
    client.patch<Department>(`/departments/${id}`, payload).then((r) => r.data),
  deleteDepartment: (id: string) => client.delete(`/departments/${id}`),

  listClasses: () => client.get<CourseWithClasses[]>('/classes').then((r) => r.data),
  createModule: (payload: { course_id: string; title: string; description?: string; position?: number }) =>
    client.post<CourseModule>('/modules', payload).then((r) => r.data),
  updateModule: (id: string, payload: { title?: string; description?: string; position?: number }) =>
    client.patch<CourseModule>(`/modules/${id}`, payload).then((r) => r.data),
  deleteModule: (id: string) => client.delete(`/modules/${id}`),
  createClass: (payload: ClassPayload) =>
    client.post<CourseClass>('/classes', payload).then((r) => r.data),
  updateClass: (id: string, payload: ClassPayload) =>
    client.patch<CourseClass>(`/classes/${id}`, payload).then((r) => r.data),
  deleteClass: (id: string) => client.delete(`/classes/${id}`),

  getClassQuiz: (classId: string) =>
    client.get<QuizAdmin>(`/classes/${classId}/quiz`).then((r) => r.data),
  upsertClassQuiz: (classId: string, payload: QuizUpsertPayload) =>
    client.put<QuizAdmin>(`/classes/${classId}/quiz`, payload).then((r) => r.data),
  deleteClassQuiz: (classId: string) => client.delete(`/classes/${classId}/quiz`),
  listClassQuizAttempts: (classId: string) =>
    client
      .get<AdminQuizAttempt[]>(`/classes/${classId}/quiz/attempts`)
      .then((r) => r.data),

  listUsers: () => client.get<CompanyUser[]>('/users').then((r) => r.data),
  createUser: (payload: CompanyUserPayload) =>
    client.post<CompanyUser>('/users', payload).then((r) => r.data),
  updateUser: (id: string, payload: Partial<CompanyUserPayload>) =>
    client.patch<CompanyUser>(`/users/${id}`, payload).then((r) => r.data),
  deactivateUser: (id: string) => client.delete(`/users/${id}`),
};
