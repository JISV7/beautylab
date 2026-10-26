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

export interface LearningPathSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningPathListResponse {
  learning_paths: LearningPathSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LearningPathCourse {
  course_id: string;
  order: number;
  created_at: string;
  course_title: string;
  course_slug: string;
  course_description: string | null;
  course_image_url: string | null;
  course_duration_hours: number | null;
  category_name: string | null;
  level_name: string | null;
}

export interface LearningPathDetail extends LearningPathSummary {
  courses: LearningPathCourse[];
  total_courses: number;
  total_duration_hours: number;
}

export type MyCourseAccessState =
  | 'completed'
  | 'in_progress'
  | 'ready_to_redeem'
  | 'unavailable'
  | 'payment_pending';

export interface MyCatalogCourse {
  course_id: string;
  course_title: string;
  course_slug: string;
  progress: number;
  has_access: boolean;
  can_redeem: boolean;
  access_state: MyCourseAccessState;
}

export const learningPathsApi = {
  listPublishedPaths: () =>
    client
      .get<LearningPathListResponse>('/learning-paths', {
        params: { published: true, page_size: 100 },
      })
      .then((response) => response.data),

  getLearningPath: (pathId: string) =>
    client
      .get<LearningPathDetail>(`/learning-paths/${pathId}`)
      .then((response) => response.data),

  getMyCourses: () =>
    client.get<MyCatalogCourse[]>('/my-courses').then((response) => response.data),
};
