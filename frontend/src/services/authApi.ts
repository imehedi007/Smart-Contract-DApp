import { User } from '@/models/types';

const VALID_CREDENTIALS = {
  email: 'imran@gmail.com',
  password: '12345678',
};

export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      return {
        email,
        token: 'mock-jwt-token-' + Date.now(),
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  logout: async (): Promise<void> => {
    // Clear any stored auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
};
