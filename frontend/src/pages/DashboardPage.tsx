import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { useNotificationStore } from '@/store/notificationStore';
import { dashboardService } from '@/services';
import type { DashboardData } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = [
  '#6366f1', // Indigo
  '#22c55e', // Success/Green
  '#ef4444', // Destructive/Red
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/80 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-2xl shadow-black/20 text-sm">
        <p className="font-bold mb-2 text-foreground/80">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color || entry.fill }} 
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-bold text-foreground">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { addNotification } = useNotificationStore();
  const hasShownAlert = useRef<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Budget Monitoring Logic
  useEffect(() => {
    if (data && user?.budgetLimit) {
      const { monthlyExpenses } = data.summary;
      const budgetLimit = user.budgetLimit;
      const status = monthlyExpenses > budgetLimit ? 'over' : monthlyExpenses > budgetLimit * 0.8 ? 'warning' : 'safe';

      // Only show alert/notification if the status has changed
      if (hasShownAlert.current !== status) {
        if (status === 'over') {
          const title = '⚠️ Over Budget Alert';
          const description = `You've exceeded your monthly limit of ${formatCurrency(budgetLimit)} by ${formatCurrency(monthlyExpenses - budgetLimit)}.`;
          
          toast({ title, description, variant: 'error' });
          addNotification({ title, description, type: 'error' });
        } else if (status === 'warning') {
          const title = '💡 Budget Warning';
          const description = `You've used over 80% of your ${formatCurrency(budgetLimit)} monthly budget.`;
          
          toast({ title, description, variant: 'warning' });
          addNotification({ title, description, type: 'warning' });
        }
        hasShownAlert.current = status;
      }
    }
  }, [data, user?.budgetLimit, formatCurrency, toast]);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardService.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
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

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return format(date, 'MMM yyyy');
  };

  // Merge monthly trends for the combined chart
  const combinedMonthlyData = () => {
    if (!data) return [];
    const months = new Map<string, { month: string; expenses: number; income: number }>();

    data.monthlyTrend.forEach((item) => {
      months.set(item.month, {
        month: formatMonth(item.month),
        expenses: item.expenses,
        income: 0,
      });
    });

    data.monthlyIncomeTrend.forEach((item) => {
      const existing = months.get(item.month);
      if (existing) {
        existing.income = item.income;
      } else {
        months.set(item.month, {
          month: formatMonth(item.month),
          expenses: 0,
          income: item.income,
        });
      }
    });

    return Array.from(months.values());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Balance',
      value: formatCurrency(data?.summary.balance || 0),
      icon: Wallet,
      trend: data?.summary.balance && data.summary.balance >= 0 ? 'up' : 'down',
      color: 'from-indigo-500 to-purple-600',
      iconColor: 'text-indigo-400',
    },
    {
      title: 'Total Income',
      value: formatCurrency(data?.summary.totalIncome || 0),
      icon: TrendingUp,
      subtitle: `${formatCurrency(data?.summary.monthlyIncome || 0)} this month`,
      color: 'from-emerald-500 to-green-600',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(data?.summary.totalExpenses || 0),
      icon: TrendingDown,
      subtitle: `${formatCurrency(data?.summary.monthlyExpenses || 0)} this month`,
      color: 'from-rose-500 to-red-600',
      iconColor: 'text-rose-400',
    },
    {
      title: 'Monthly Savings',
      value: formatCurrency(data?.summary.monthlySavings || 0),
      icon: PiggyBank,
      trend: data?.summary.monthlySavings && data.summary.monthlySavings >= 0 ? 'up' : 'down',
      color: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your financial overview at a glance
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Card className="card-hover overflow-hidden relative border-border/40 hover:border-primary/20 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity`} />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-2 tracking-tight">{card.value}</p>
                    {card.subtitle && (
                      <div className="mt-2 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          {card.subtitle}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg shadow-black/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {card.trend && (
                  <div className={`flex items-center gap-1 mt-4 text-[10px] font-bold uppercase tracking-widest ${card.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {card.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {card.trend === 'up' ? 'Trend High' : 'Trend Low'}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-primary rounded-full" />
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      content={<CustomTooltip formatter={formatCurrency} />}
                      cursor={{ fill: 'var(--color-accent)', opacity: 0.1 }}
                    />
                    <Bar 
                      dataKey="income" 
                      fill="url(#incomeGradient)" 
                      radius={[6, 6, 0, 0]} 
                      name="Income"
                      stroke="#22c55e"
                      strokeWidth={1} 
                      animationDuration={1500}
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="url(#expenseGradient)" 
                      radius={[6, 6, 0, 0]} 
                      name="Expenses"
                      stroke="#ef4444"
                      strokeWidth={1}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-pink-500 rounded-full" />
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="42%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={6}
                        dataKey="total"
                        nameKey="category"
                        stroke="none"
                        animationBegin={200}
                        animationDuration={1500}
                      >
                        {data.categoryBreakdown.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            className="hover:opacity-80 transition-opacity cursor-pointer outline-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tighter">
                            {value}
                          </span>
                        )}
                        wrapperStyle={{ paddingLeft: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                       <TrendingUp className="w-6 h-6 opacity-20" />
                    </div>
                    No data to visualize yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Recent Expenses */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-500">
                <ArrowDownRight className="w-4 h-4" />
                Latest Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.recentExpenses && data.recentExpenses.length > 0 ? (
                  data.recentExpenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-accent/5 hover:bg-accent/20 border border-transparent hover:border-border/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{expense.title}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                             {expense.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-500">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                          {safeFormatDate(expense.date, 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                     <p className="text-xs font-medium text-muted-foreground">Log your first expense</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Incomes */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-500">
                <ArrowUpRight className="w-4 h-4" />
                Recent Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.recentIncomes && data.recentIncomes.length > 0 ? (
                  data.recentIncomes.map((income) => (
                    <div
                      key={income._id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-accent/5 hover:bg-accent/20 border border-transparent hover:border-border/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{income.title}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                             {income.source}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-500">
                          +{formatCurrency(income.amount)}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                          {safeFormatDate(income.date, 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                     <p className="text-xs font-medium text-muted-foreground">Add your first income</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
