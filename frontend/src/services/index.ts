import api from './api';
import type {
  ApiResponse,
  AuthResponse,
  DashboardData,
  Expense,
  Income,
  Category,
  Pagination,
  ExpenseFormData,
  IncomeFormData,
} from '../types';

// ─── Auth ──────────────────────────────────────────────
export const authService = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; currency?: string; budgetLimit?: number }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  
  setup2FA: async () => {
    const response = await api.get<ApiResponse<{ qrCodeDataUri: string; secret: string }>>('/auth/2fa/setup');
    return response.data;
  },

  verify2FA: async (token: string) => {
    const response = await api.post<ApiResponse<{ user: any }>>('/auth/2fa/verify', { token });
    return response.data;
  },

  disable2FA: async () => {
    const response = await api.post<ApiResponse<{ isTwoFactorEnabled: boolean }>>('/auth/2fa/disable');
    return response.data;
  },

  login2FA: async (userId: string, token: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/2fa/login', { userId, token });
    return response.data;
  },
};

// ─── Dashboard ──────────────────────────────────────────────
export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data;
  },
};

// ─── Expenses ──────────────────────────────────────────────
export const expenseService = {
  getAll: async (params?: Record<string, string>) => {
    const response = await api.get<
      ApiResponse<{ expenses: Expense[]; pagination: Pagination }>
    >('/expenses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: ExpenseFormData) => {
    const response = await api.post<ApiResponse<Expense>>('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: ExpenseFormData) => {
    const response = await api.put<ApiResponse<Expense>>(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

// ─── Income ──────────────────────────────────────────────
export const incomeService = {
  getAll: async (params?: Record<string, string>) => {
    const response = await api.get<
      ApiResponse<{ incomes: Income[]; pagination: Pagination }>
    >('/income', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Income>>(`/income/${id}`);
    return response.data;
  },

  create: async (data: IncomeFormData) => {
    const response = await api.post<ApiResponse<Income>>('/income', data);
    return response.data;
  },

  update: async (id: string, data: IncomeFormData) => {
    const response = await api.put<ApiResponse<Income>>(`/income/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/income/${id}`);
    return response.data;
  },
};

// ─── Categories ──────────────────────────────────────────────
export const categoryService = {
  getAll: async (type?: string) => {
    const params = type ? { type } : {};
    const response = await api.get<ApiResponse<Category[]>>('/categories', { params });
    return response.data;
  },

  create: async (data: { name: string; type: 'expense' | 'income'; icon?: string; color?: string }) => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
