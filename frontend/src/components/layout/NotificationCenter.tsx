import { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, type Notification } from '@/store/notificationStore';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
      default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group transition-transform active:scale-95"
      >
        <Bell className={cn("w-5 h-5 transition-colors", isOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center border-2 border-card ring-2 ring-primary/20 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed sm:absolute left-2 right-2 top-16 sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96 max-h-[70vh] sm:max-h-[600px] rounded-2xl border bg-card shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-accent/5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => markAllAsRead()} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Mark all as read">
                  <CheckCheck className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => clearNotifications()} className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Clear all">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[480px] custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs opacity-60 mt-1">We'll notify you when something important happens</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <motion.div
                      layout
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "p-4 flex gap-3 transition-colors cursor-pointer group hover:bg-accent/30",
                        !notification.read && "bg-primary/[0.03] border-l-2 border-primary"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        notification.type === 'error' ? "bg-destructive/10" : 
                        notification.type === 'warning' ? "bg-warning/10" : 
                        notification.type === 'success' ? "bg-success/10" : "bg-info/10"
                      )}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className={cn("text-sm leading-tight", !notification.read ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                            {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                            {notification.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-medium font-sans">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 ring-4 ring-primary/10" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-border bg-accent/5 text-center">
               <button className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors py-1">View All Activity</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
