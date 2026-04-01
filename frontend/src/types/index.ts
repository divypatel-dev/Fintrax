export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  currency: string;
  budgetLimit: number;
  isTwoFactorEnabled: boolean;
  createdAt?: string;
}

export interface Expense {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  source: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
}

export interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
  };
  monthlyTrend: Array<{
    month: string;
    expenses: number;
    count: number;
  }>;
  monthlyIncomeTrend: Array<{
    month: string;
    income: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  recentExpenses: Expense[];
  recentIncomes: Income[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  userId?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface IncomeFormData {
  title: string;
  amount: number;
  source: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
