import axios from 'axios';
import { API_URL, getApiErrorMessage } from './companyApi';

const client = axios.create({ baseURL: `${API_URL}/community` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { getApiErrorMessage };

export interface LastMessage {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  message_count: number;
  online_count: number;
  last_message: LastMessage | null;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  content: string;
  created_at: string;
}

export interface CommunityMember {
  id: string;
  full_name: string;
  email: string;
  department_name: string | null;
  is_online: boolean;
}

export interface CommunityOnlineUser {
  id: string;
  full_name: string;
  email: string;
}

export interface CreateRoomPayload {
  name: string;
  description?: string | null;
}

export const communityApi = {
  listRooms: () =>
    client.get<ChatRoom[]>('/rooms').then((response) => response.data),
  createRoom: (payload: CreateRoomPayload) =>
    client
      .post<ChatRoom>('/rooms', payload)
      .then((response) => response.data),
  listMessages: (roomId: string, params?: { limit?: number; before?: string }) =>
    client
      .get<ChatMessage[]>(`/rooms/${roomId}/messages`, { params })
      .then((response) => response.data),
  sendMessage: (roomId: string, content: string) =>
    client
      .post<ChatMessage>(`/rooms/${roomId}/messages`, { content })
      .then((response) => response.data),
  listMembers: () =>
    client
      .get<CommunityMember[]>('/members')
      .then((response) => response.data),
};

export const buildCommunitySocketUrl = (token: string, roomId: string): string => {
  const url = new URL(`${API_URL}/community/ws`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('token', token);
  url.searchParams.set('room_id', roomId);
  return url.toString();
};
