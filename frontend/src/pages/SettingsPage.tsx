import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Shield, Palette, Globe, DollarSign, Lock, Smartphone, CheckCircle, AlertCircle, Trash2, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { authService, expenseService, incomeService } from '@/services';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { toast } = useToast();
  const { currency: currentCurrencySymbol, formatCurrency } = useCurrency();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    currency: user?.currency || 'USD',
    budgetLimit: user?.budgetLimit?.toString() || '0',
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [mfaData, setMfaData] = useState<{ qrCodeDataUri: string; secret: string } | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [verifyingMFA, setVerifyingMFA] = useState(false);
  const [disablingMFA, setDisablingMFA] = useState(false);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const [expensesRes, incomeRes] = await Promise.all([
        expenseService.getAll({ limit: '1000' }),
        incomeService.getAll({ limit: '1000' })
      ]);

      const expenses = expensesRes.data.expenses.map(e => ({
        type: 'Expense',
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: format(new Date(e.date), 'MMM dd, yyyy'),
        notes: e.notes || '-'
      }));

      const incomes = incomeRes.data.incomes.map(i => ({
        type: 'Income',
        title: i.title,
        amount: i.amount,
        category: i.source,
        date: format(new Date(i.date), 'MMM dd, yyyy'),
        notes: i.notes || '-'
      }));

      const allData = [...expenses, ...incomes].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (allData.length === 0) {
        toast({ title: 'No data to export', variant: 'info' });
        return;
      }

      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text('Financial Report', 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated for: ${user?.name || 'User'}`, 14, 30);
      doc.text(`Date: ${format(new Date(), 'pppp')}`, 14, 36);
      doc.text(`Currency: ${user?.currency || 'USD'}`, 14, 42);

      // Summary
      const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

      doc.setFontSize(14);
      doc.setTextColor(33);
      doc.text('Account Summary', 14, 55);

      const safePDFAmount = (amt: number) =>
        `${user?.currency || 'USD'} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
          ['Total Income', safePDFAmount(totalIncome)],
          ['Total Expenses', safePDFAmount(totalExpense)],
          ['Net Balance', safePDFAmount(totalIncome - totalExpense)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
      });

      // Transactions Table
      doc.text('Transactions History', 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Type', 'Title', 'Category', 'Amount']],
        body: allData.map(row => [
          row.date,
          row.type,
          row.title,
          row.category,
          row.type === 'Expense' ? `-${safePDFAmount(row.amount)}` : `+${safePDFAmount(row.amount)}`
        ]),
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 40 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const text = data.cell.text[0];
            if (text.startsWith('-')) data.cell.styles.textColor = [239, 68, 68];
            if (text.startsWith('+')) data.cell.styles.textColor = [34, 197, 94];
          }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        headStyles: { fillColor: [31, 41, 55] }
      });

      doc.save(`fintrack-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'PDF Report downloaded', variant: 'success' });
    } catch (error) {
      console.error('PDF Export failed:', error);
      toast({ title: 'Failed to generate PDF', variant: 'error' });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all data
      const [expensesRes, incomeRes] = await Promise.all([
        expenseService.getAll({ limit: '1000' }),
        incomeService.getAll({ limit: '1000' })
      ]);

      const expenses = expensesRes.data.expenses.map(e => ({
        Type: 'Expense',
        Title: e.title,
        Amount: e.amount,
        Category: e.category,
        Date: format(new Date(e.date), 'yyyy-MM-dd'),
        Notes: e.notes || ''
      }));

      const incomes = incomeRes.data.incomes.map(i => ({
        Type: 'Income',
        Title: i.title,
        Amount: i.amount,
        Category: i.source,
        Date: format(new Date(i.date), 'yyyy-MM-dd'),
        Notes: i.notes || ''
      }));

      const allData = [...expenses, ...incomes].sort((a, b) =>
        new Date(b.Date).getTime() - new Date(a.Date).getTime()
      );

      if (allData.length === 0) {
        toast({ title: 'No data to export', variant: 'info' });
        return;
      }

      // Convert to CSV
      const headers = Object.keys(allData[0]).join(',');
      const rows = allData.map(row =>
        Object.values(row).map(value => `"${value}"`).join(',')
      );
      const csvContent = [headers, ...rows].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fintrack-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: 'Data exported successfully', variant: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: 'Failed to export data', variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleStart2FASetup = async () => {
    try {
      const response = await authService.setup2FA();
      setMfaData(response.data);
      setShow2FAModal(true);
    } catch (error) {
      toast({ title: 'Failed to start 2FA setup', variant: 'error' });
    }
  };

  const handleVerify2FA = async () => {
    if (!mfaToken) return;
    setVerifyingMFA(true);
    try {
      const response = await authService.verify2FA(mfaToken);
      setUser(response.data.user);
      setShow2FAModal(false);
      setMfaToken('');
      toast({ title: '2FA enabled successfully', variant: 'success' });
    } catch (error) {
      toast({ title: 'Invalid 2FA token', variant: 'error' });
    } finally {
      setVerifyingMFA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    setDisablingMFA(true);
    try {
      const response = await authService.disable2FA();
      setUser({ ...user!, isTwoFactorEnabled: false });
      toast({ title: '2FA disabled successfully', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to disable 2FA', variant: 'error' });
    } finally {
      setDisablingMFA(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authService.updateProfile({
        name: profileData.name,
        currency: profileData.currency,
        budgetLimit: parseFloat(profileData.budgetLimit),
      });

      // Update global state AND local storage
      setUser(response.data);

      toast({ title: 'Profile updated', variant: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.message || 'Failed to update profile',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const currencyOptions: SelectOption[] = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full pb-8"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="border-border/40">
        <div className="h-1 bg-gradient-to-r from-primary/50 to-purple-500/50" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and app preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your name"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={user?.email || ''} disabled className="pl-9 bg-accent/30 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Preferred Currency
                </label>
                <Select
                  value={profileData.currency}
                  options={currencyOptions}
                  onChange={(val) => setProfileData({ ...profileData, currency: val })}
                  placeholder="Select currency"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Monthly Budget Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                    {currentCurrencySymbol === 'USD' ? '$' : currentCurrencySymbol === 'EUR' ? '€' : currentCurrencySymbol === 'GBP' ? '£' : currentCurrencySymbol === 'INR' ? '₹' : currentCurrencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={profileData.budgetLimit}
                    onChange={(e) => setProfileData({ ...profileData, budgetLimit: e.target.value })}
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button type="submit" isLoading={saving} className="gap-2 shadow-lg shadow-primary/20">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the application theme to your liking</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setTheme('light')}
              className={`group flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'light'
                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                  : 'border-border hover:border-primary/50 grayscale hover:grayscale-0'
                }`}
            >
              <div className="w-full h-24 rounded-xl bg-white border border-gray-200 mb-4 transition-transform group-hover:scale-105" />
              <p className="text-sm font-bold text-center">Light Mode</p>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`group flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'dark'
                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                  : 'border-border hover:border-primary/50 grayscale hover:grayscale-0'
                }`}
            >
              <div className="w-full h-24 rounded-xl bg-slate-900 border border-slate-700 mb-4 transition-transform group-hover:scale-105" />
              <p className="text-sm font-bold text-center">Dark Mode</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account Security & Data */}
      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Security & Data</CardTitle>
              <CardDescription>Manage your data and security preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all text-center gap-2 group cursor-pointer",
                user?.isTwoFactorEnabled
                  ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                  : "bg-accent/20 border-border/50 hover:bg-accent/40"
              )}
              onClick={user?.isTwoFactorEnabled ? handleDisable2FA : handleStart2FASetup}
            >
              <div className={cn(
                "p-3 rounded-xl transition-colors",
                user?.isTwoFactorEnabled ? "bg-emerald-500/20 text-emerald-500" : "bg-accent/40 text-muted-foreground group-hover:text-primary"
              )}>
                <Smartphone className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold mt-1">Two-Factor Auth</p>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                user?.isTwoFactorEnabled ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
              )}>
                {user?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <p className="text-[10px] text-muted-foreground mt-1 px-4">
                {user?.isTwoFactorEnabled ? 'Securely protected by MFA' : 'Add an extra layer of security'}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-accent/20 border border-border/50 text-center gap-2 group cursor-pointer hover:bg-accent/40 transition-colors"
              onClick={handleExportPDF}
              style={{ pointerEvents: exportingPDF ? 'none' : 'auto' }}
            >
              <FileText className={cn("w-8 h-8 text-primary transition-transform group-hover:scale-110", exportingPDF && "animate-pulse")} />
              <p className="text-sm font-bold mt-2">Export to PDF</p>
              <span className="text-[10px] font-bold text-primary mt-1 bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                {exportingPDF ? 'Generating...' : 'Download PDF'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-accent/20 border border-border/50 text-center gap-2 group cursor-pointer hover:bg-accent/40 transition-colors"
              onClick={handleExport}
              style={{ pointerEvents: exporting ? 'none' : 'auto' }}
            >
              <Globe className={cn("w-8 h-8 text-primary transition-transform group-hover:scale-110", exporting && "animate-pulse")} />
              <p className="text-sm font-bold mt-2">Export My Data</p>
              <span className="text-[10px] font-bold text-primary mt-1 bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                {exporting ? 'Preparing...' : 'Download CSV'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with an authenticator app (like Google Authenticator or Authy) to enable MFA.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6 text-center">
            {mfaData?.qrCodeDataUri ? (
              <div className="relative p-4 bg-white rounded-2xl shadow-inner group">
                <img src={mfaData.qrCodeDataUri} alt="MFA QR Code" className="w-48 h-48" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <p className="text-[10px] font-bold text-slate-800 bg-slate-100/80 px-2 py-1 rounded shadow">Scan Me</p>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 bg-accent/20 animate-pulse rounded-2xl border-2 border-dashed border-border" />
            )}

            <div className="space-y-4 w-full">
              <div className="p-3 bg-accent/30 rounded-xl border border-border/50 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1 uppercase tracking-tight">
                  <Key className="w-3 h-3" />
                  Manual Setup Key
                </div>
                <code className="block text-sm font-mono break-all text-primary font-bold">{mfaData?.secret}</code>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Token</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-widest"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShow2FAModal(false)}>Cancel</Button>
            <Button
              onClick={handleVerify2FA}
              isLoading={verifyingMFA}
              disabled={mfaToken.length < 6}
              className="min-w-[120px]"
            >
              Verify & Enable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
