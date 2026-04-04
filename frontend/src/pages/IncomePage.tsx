import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Filter,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, type SelectOption } from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { incomeService, categoryService } from '@/services';
import type { Income, Category, Pagination } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';
import { AxiosError } from 'axios';

export function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { formatCurrency, currency } = useCurrency();

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    source: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    isRecurring: false,
    recurringFrequency: '' as string,
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: pagination.page.toString(),
        limit: '10',
      };
      if (search) params.search = search;

      const response = await incomeService.getAll(params);
      setIncomes(response.data.incomes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll('income');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const openForm = (income?: Income) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        title: income.title,
        amount: income.amount.toString(),
        source: income.source,
        date: safeFormatDate(income.date, 'yyyy-MM-dd') === 'Invalid Date' ? format(new Date(), 'yyyy-MM-dd') : format(new Date(income.date), 'yyyy-MM-dd'),
        notes: income.notes || '',
        isRecurring: income.isRecurring,
        recurringFrequency: income.recurringFrequency || '',
      });
    } else {
      setEditingIncome(null);
      setFormData({
        title: '',
        amount: '',
        source: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        isRecurring: false,
        recurringFrequency: '',
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        source: formData.source,
        date: formData.date,
        notes: formData.notes || undefined,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.recurringFrequency as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined || undefined,
      };

      if (editingIncome) {
        await incomeService.update(editingIncome._id, payload);
        toast({ title: 'Income updated', variant: 'success' });
      } else {
        await incomeService.create(payload);
        toast({ title: 'Income added', variant: 'success' });
      }

      setShowForm(false);
      fetchIncomes();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.message || 'Something went wrong',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await incomeService.delete(deleteId);
      toast({ title: 'Income deleted', variant: 'success' });
      setDeleteId(null);
      fetchIncomes();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'error' });
    }
  };
  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const sourceOptions: SelectOption[] = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
    icon: <span>{cat.icon}</span>,
  }));

  const frequencyOptions: SelectOption[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Income</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track your earnings and revenue</p>
        </div>
        <Button onClick={() => openForm()} className="shrink-0 group" variant="success">
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Add Income
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search income resources..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Income list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : incomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No income entries found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {search ? 'Try adjusting your search query' : 'Start tracking your earnings by adding your first income source'}
              </p>
              {!search && (
                <Button onClick={() => openForm()} className="mt-4 shadow-lg shadow-emerald-500/20" variant="success">
                  <Plus className="w-4 h-4" />
                  Add Income
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {incomes.map((income, index) => (
                        <motion.tr
                          key={income._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium">{income.title}</p>
                              {income.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">{income.notes}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-success/10 text-success border border-success/20">
                              {categories.find((c) => c.name === income.source)?.icon || '💰'} {income.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {safeFormatDate(income.date, 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-success">
                            +{formatCurrency(income.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openForm(income)} className="hover:text-success">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(income._id)} className="hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {incomes.map((income) => (
                  <div key={income._id} className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-success/10 flex items-center justify-center text-base sm:text-lg shadow-sm shrink-0">
                        {categories.find((c) => c.name === income.source)?.icon || '💰'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{income.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {income.source} • {safeFormatDate(income.date, 'MMM dd')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                       <div className="text-right">
                        <span className="text-sm font-bold text-success">
                          +{formatCurrency(income.amount)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openForm(income)} className="h-8 w-8">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(income._id)} className="h-8 w-8 text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total}
                  </p>
                  <div className="flex items-center gap-2 flex-1 sm:flex-none justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      className="gap-1 px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </Button>
                    <span className="px-3 text-sm font-medium">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="gap-1 px-3"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Income Entry' : 'Add New Income'}</DialogTitle>
            <DialogDescription>
              {editingIncome ? 'Update your earnings details' : 'Log a new source of revenue to your account'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Freelance Project"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Source</label>
              <Select
                value={formData.source}
                options={sourceOptions}
                onChange={(val) => setFormData({ ...formData, source: val })}
                placeholder="Select income source"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add extra details..."
              />
            </div>
            
            <motion.div 
              className="p-3 rounded-xl border border-border/50 bg-accent/20 space-y-3"
              animate={{ height: formData.isRecurring ? 'auto' : '44px' }}
            >
              <div className="flex items-center justify-between">
                <label htmlFor="isRecurringIncome" className="text-sm font-medium cursor-pointer">
                  Recurring income
                </label>
                <input
                  type="checkbox"
                  id="isRecurringIncome"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded border-input cursor-pointer accent-emerald-500"
                />
              </div>
              
              <AnimatePresence>
                {formData.isRecurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-xs font-medium text-muted-foreground uppercase">Frequency</label>
                    <Select
                      value={formData.recurringFrequency}
                      options={frequencyOptions}
                      onChange={(val) => setFormData({ ...formData, recurringFrequency: val })}
                      placeholder="Select frequency"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" isLoading={formLoading} className="min-w-[100px] shadow-lg shadow-emerald-500/20">
                {editingIncome ? 'Save Changes' : 'Add Income'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Income</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this income entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="shadow-lg shadow-destructive/20">
              Delete Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
