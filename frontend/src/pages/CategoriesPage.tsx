import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Tags } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
import { categoryService } from '@/services';
import type { Category } from '@/types';
import { AxiosError } from 'axios';

const EMOJI_OPTIONS = ['🍔', '🚗', '🛍️', '💡', '🎬', '🏥', '📚', '✈️', '🛒', '🏠', '🛡️', '📦', '💰', '💻', '📈', '🏢', '🏘️', '💵', '🎮', '🎵', '🐕', '💪', '🎨', '☕'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#6366f1', '#78716c'];

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'expense' | 'income',
    icon: '📦',
    color: '#6366f1',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await categoryService.create(formData);
      toast({ title: 'Category created', variant: 'success' });
      setShowForm(false);
      fetchCategories();
      setFormData({ name: '', type: activeTab, icon: '📦', color: '#6366f1' });
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

  const handleDelete = async (id: string) => {
    try {
      await categoryService.delete(id);
      toast({ title: 'Category deleted', variant: 'success' });
      fetchCategories();
    } catch (error) {
      toast({ title: 'Cannot delete default category', variant: 'error' });
    }
  };

  const filteredCategories = categories.filter((cat) => cat.type === activeTab);

  const typeOptions: SelectOption[] = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Categories</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your expense and income categories</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0 group">
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Add Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-accent/20 w-fit border border-border/50">
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'expense'
              ? 'bg-card text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Expense
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'income'
              ? 'bg-card text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Income
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="card-hover group border-border/40 hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{category.name}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {category.isDefault ? 'Standard' : 'Personal'}
                        </p>
                      </div>
                    </div>
                    {!category.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category._id)}
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Add New</span>
          </motion.button>
        </div>
      )}

      {/* Add category dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>Create a custom category for better tracking</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Subscription, Leisure..."
                className="h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category Type</label>
              <Select
                value={formData.type}
                options={typeOptions}
                onChange={(val) => setFormData({ ...formData, type: val as 'expense' | 'income' })}
                placeholder="Select type"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Select Icon</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 rounded-xl bg-accent/20 border border-border/50 max-h-40 overflow-y-auto custom-scrollbar">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                      formData.icon === emoji
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Choose Color</label>
              <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-accent/20 border border-border/50">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      formData.color === color 
                        ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={formLoading} className="min-w-[120px]">
                Create Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
