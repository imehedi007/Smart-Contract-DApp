export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
  },
  videos: {
    list: '/videos',
    upload: '/videos',
    detail: (id: string) => `/videos/${id}`,
    metadata: (id: string) => `/videos/${id}/metadata`,
    stream: (id: string) => `/videos/${id}/stream`,
  },
};
