import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useCurrency = () => {
  const { user } = useAuthStore();
  const currency = user?.currency || 'USD';

  const formatCurrency = useCallback((amount: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount);
  }, [currency]);

  return { formatCurrency, currency };
};
