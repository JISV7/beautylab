import axios from 'axios';
import { API_URL } from './companyApi';

const client = axios.create({ baseURL: `${API_URL}/dashboard` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DashboardStats {
  active_courses: number;
  completed_courses: number;
  total_courses: number;
  average_progress: number;
  classes_completed: number;
  total_required_classes: number;
  study_hours: number;
  current_streak_days: number;
  longest_streak_days: number;
}

export interface ContinueCourse {
  course_id: string;
  title: string;
  image_url: string | null;
  progress: number;
  next_class_id: string | null;
  next_class_title: string | null;
}

export interface WeeklyActivityItem {
  date: string;
  activity_count: number;
  minutes: number;
}

export interface LearningPathSummary {
  id: string;
  title: string;
  total_courses: number;
  completed_courses: number;
  progress: number;
}

export interface Recommendation {
  course_id: string;
  title: string;
  image_url: string | null;
  duration_hours: number | null;
  level_name: string | null;
  category_name: string | null;
  price: number;
  reason: string;
}

export type RecentCourseStatus = 'completed' | 'in_progress' | 'not_started';

export interface RecentCourse {
  course_id: string;
  title: string;
  image_url: string | null;
  progress: number;
  status: RecentCourseStatus;
  last_activity_at: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  continue_course: ContinueCourse | null;
  weekly_activity: WeeklyActivityItem[];
  learning_path: LearningPathSummary | null;
  recommendations: Recommendation[];
  recent_courses: RecentCourse[];
}

export type RecentActivityType =
  | 'class_completed'
  | 'quiz_passed'
  | 'quiz_attempted'
  | 'license_redeemed'
  | 'enrolled';

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  title: string;
  detail: string;
  course_id: string | null;
  course_title: string | null;
  occurred_at: string;
}

export const dashboardApi = {
  getSummary: (signal?: AbortSignal) =>
    client.get<DashboardSummary>('/summary', { signal }).then((response) => response.data),
  getRecentActivity: (limit = 8, signal?: AbortSignal) =>
    client
      .get<RecentActivityItem[]>('/recent-activity', { params: { limit }, signal })
      .then((response) => response.data),
};
