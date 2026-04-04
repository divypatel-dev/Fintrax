import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  login2FA: (userId: string, token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  login: async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    if (response.data.mfaRequired) {
      return response.data; // Return { mfaRequired: true, userId: '...' }
    }

    const { user, accessToken, refreshToken } = response.data;
    if (user && accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    }
    return response.data;
  },

  login2FA: async (userId: string, token: string) => {
    const response = await authService.login2FA(userId, token);
    const { user, accessToken, refreshToken } = response.data;

    if (user && accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken!);
      localStorage.setItem('refreshToken', refreshToken!);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    }
  },

  register: async (name: string, email: string, password: string) => {
    await authService.register({ name, email, password });
    // No longer storing tokens or setting isAuthenticated = true
    // so the user is forced to log in manually as per request.
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Continue logout even if API fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: () => {
    const stored = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (stored && accessToken) {
      try {
        const user = JSON.parse(stored) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
