import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Tags,
  Settings,
  X,
  Wallet,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: ArrowDownCircle, label: 'Expenses' },
  { to: '/income', icon: ArrowUpCircle, label: 'Income' },
  { to: '/categories', icon: Tags, label: 'Categories' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { canInstall, installApp } = usePWAInstall();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">FinTrack</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-accent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          <AnimatePresence>
            {canInstall && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="relative group overflow-hidden p-[1px] rounded-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500"
              >
                <button
                  onClick={installApp}
                  className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-[11px] text-sm font-bold text-white bg-sidebar transition-all group-hover:bg-transparent duration-300 relative z-10"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  <span className="group-hover:scale-110 transition-transform">Get App</span>
                </button>
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="px-3 py-4 rounded-xl bg-accent/30 border border-border/50 text-xs text-muted-foreground relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
              <Wallet className="w-12 h-12 rotate-12" />
            </div>
            <p className="font-bold text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              FinTrack Pro
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-tight">Version 1.0.4 • Premium Edition</p>
          </div>
        </div>
      </aside>
    </>
  );
}
