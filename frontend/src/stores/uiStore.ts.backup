import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  options?: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closable?: boolean;
    backdrop?: boolean;
  };
}

interface LoadingState {
  [key: string]: boolean;
}

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Loading states
  isGlobalLoading: boolean;
  loadingStates: LoadingState;
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  modals: Modal[];
  
  // Navigation
  sidebarOpen: boolean;
  
  // Error boundary
  hasError: boolean;
  errorInfo: string | null;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    // Initial state
    theme: 'system',
    isGlobalLoading: false,
    loadingStates: {},
    notifications: [],
    modals: [],
    sidebarOpen: true,
    hasError: false,
    errorInfo: null,

    // Actions
    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          const isDark = theme === 'dark' || 
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          
          root.classList.toggle('dark', isDark);
        }
      }),

    setGlobalLoading: (loading) =>
      set((state) => {
        state.isGlobalLoading = loading;
      }),

    setLoading: (key, loading) =>
      set((state) => {
        if (loading) {
          state.loadingStates[key] = true;
        } else {
          delete state.loadingStates[key];
        }
      }),

    isLoading: (key) => {
      const state = get();
      return state.loadingStates[key] || false;
    },

    addNotification: (notification) =>
      set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
          ...notification,
          id,
          duration: notification.duration ?? 5000,
        };
        
        state.notifications.push(newNotification);
        
        // Auto-remove notification after duration
        if (!notification.persistent && newNotification.duration > 0) {
          setTimeout(() => {
            const currentState = get();
            currentState.removeNotification(id);
          }, newNotification.duration);
        }
      }),

    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),

    clearNotifications: () =>
      set((state) => {
        state.notifications = [];
      }),

    openModal: (modal) =>
      set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newModal: Modal = {
          ...modal,
          id,
        };
        
        state.modals.push(newModal);
      }),

    closeModal: (id) =>
      set((state) => {
        state.modals = state.modals.filter(m => m.id !== id);
      }),

    closeAllModals: () =>
      set((state) => {
        state.modals = [];
      }),

    setSidebarOpen: (open) =>
      set((state) => {
        state.sidebarOpen = open;
      }),

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

    setError: (error) =>
      set((state) => {
        state.hasError = !!error;
        state.errorInfo = error;
      }),

    clearError: () =>
      set((state) => {
        state.hasError = false;
        state.errorInfo = null;
      }),
  }))
);

// Helper hooks for convenience
export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore();
  return { notifications, addNotification, removeNotification, clearNotifications };
};

export const useModals = () => {
  const { modals, openModal, closeModal, closeAllModals } = useUIStore();
  return { modals, openModal, closeModal, closeAllModals };
};

export const useLoading = (key?: string) => {
  const { isGlobalLoading, loadingStates, setGlobalLoading, setLoading, isLoading } = useUIStore();
  
  if (key) {
    return {
      isLoading: isLoading(key),
      setLoading: (loading: boolean) => setLoading(key, loading),
    };
  }
  
  return {
    isGlobalLoading,
    setGlobalLoading,
    isLoading,
    setLoading,
  };
}; 