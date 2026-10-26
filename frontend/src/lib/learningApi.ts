import axios from 'axios';
import { API_URL, getApiErrorMessage } from './companyApi';

const client = axios.create({ baseURL: `${API_URL}/catalog` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { getApiErrorMessage };

export interface ClassQuizSummary {
  question_count: number;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
}

export interface ClassContent {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'quiz' | 'mixed';
  video_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_required: boolean;
  has_quiz: boolean;
  quiz: ClassQuizSummary | null;
  is_completed: boolean;
  best_score: number | null;
  passed: boolean;
  attempts_used: number;
}

export interface ModuleContent {
  id: string;
  title: string;
  description: string | null;
  position: number;
  classes: ClassContent[];
}

export interface CourseContent {
  course_id: string;
  title: string;
  progress: number;
  status: string;
  modules: ModuleContent[];
}

export interface QuizAttemptSummary {
  id: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
}

export interface StudentQuizState {
  quiz_id: string;
  class_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  question_count: number;
  is_published: boolean;
  attempts_used: number;
  attempts_remaining: number | null;
  best_score: number | null;
  passed: boolean;
  in_progress_attempt_id: string | null;
  last_attempt: QuizAttemptSummary | null;
}

export interface StudentQuizOption {
  id: string;
  text: string;
  position: number;
}

export interface StudentQuizQuestion {
  id: string;
  prompt: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  points: number;
  position: number;
  options: StudentQuizOption[];
}

export interface QuizAttemptStart {
  attempt_id: string;
  started_at: string;
  expires_at: string | null;
  questions: StudentQuizQuestion[];
}

export interface QuizQuestionResult {
  question_id: string;
  prompt: string;
  is_correct: boolean;
  points_awarded: number;
  points_possible: number;
  correct_option_ids: string[] | null;
  explanation: string | null;
}

export interface QuizAttemptResult {
  attempt_id: string;
  quiz_id: string;
  status: string;
  score: number;
  passed: boolean;
  passing_score: number;
  completed_at: string | null;
  show_answers: boolean;
  results: QuizQuestionResult[];
}

export interface ClassCompletionResponse {
  class_id: string;
  is_completed: boolean;
  progress: number;
  status: string;
}

export interface UserCourseLicense {
  id: string;
  license_code: string;
  status: string;
  license_type: string;
  redeemed_at: string | null;
  redeemed_by_user_id: string | null;
  can_redeem: boolean;
}

export type CourseAccessState =
  | 'payment_pending'
  | 'ready_to_redeem'
  | 'in_progress'
  | 'completed'
  | 'unavailable';

export interface UserCourse {
  course_id: string;
  course_title: string;
  course_slug: string;
  course_image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  licenses: UserCourseLicense[];
  total_paid: string;
  total_required: string;
  payment_progress: number;
  is_fully_paid: boolean;
  enrollment_id: number | null;
  enrollment_status: string | null;
  progress: number;
  completed_at: string | null;
  last_activity_at: string | null;
  has_access: boolean;
  can_redeem: boolean;
  access_state: CourseAccessState;
}

export const learningApi = {
  getMyCourses: () => client.get<UserCourse[]>('/my-courses').then((r) => r.data),
  getCourseContent: (courseId: string) =>
    client.get<CourseContent>(`/my-courses/${courseId}/content`).then((r) => r.data),
  completeClass: (courseId: string, classId: string) =>
    client
      .post<ClassCompletionResponse>(
        `/my-courses/${courseId}/classes/${classId}/complete`,
      )
      .then((r) => r.data),
  getQuizState: (courseId: string, classId: string) =>
    client
      .get<StudentQuizState>(`/my-courses/${courseId}/classes/${classId}/quiz`)
      .then((r) => r.data),
  startQuiz: (courseId: string, classId: string) =>
    client
      .post<QuizAttemptStart>(
        `/my-courses/${courseId}/classes/${classId}/quiz/attempts`,
      )
      .then((r) => r.data),
  submitQuiz: (
    attemptId: string,
    answers: { question_id: string; selected_option_ids: string[] }[],
  ) =>
    client
      .post<QuizAttemptResult>(`/quiz-attempts/${attemptId}/submit`, { answers })
      .then((r) => r.data),
  getAttempts: (courseId: string, classId: string) =>
    client
      .get<QuizAttemptSummary[]>(
        `/my-courses/${courseId}/classes/${classId}/quiz/attempts`,
      )
      .then((r) => r.data),
};
