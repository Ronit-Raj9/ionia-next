// ==========================================
// 🎨 UI STORE - GLOBAL UI STATE MANAGEMENT
// ==========================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// ==========================================
// 🏷️ UI TYPES & INTERFACES
// ==========================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

export interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  content: string | React.ReactNode;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  closable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface LoadingState {
  [key: string]: boolean;
}

interface UIState {
  // === LOADING STATE ===
  isGlobalLoading: boolean;
  loadingStates: LoadingState;
  
  // === NOTIFICATIONS ===
  notifications: Notification[];
  maxNotifications: number;
  
  // === MODALS ===
  modals: Modal[];
  
  // === THEME ===
  theme: 'light' | 'dark' | 'system';
  
  // === SIDEBAR ===
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // === MOBILE ===
  isMobile: boolean;
  
  // ==========================================
  // 🎯 ACTIONS
  // ==========================================
  
  // Loading Actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearAllLoading: () => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Modal Actions
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Theme Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  
  // Sidebar Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapse: () => void;
  
  // Mobile Actions
  setIsMobile: (isMobile: boolean) => void;
}

// ==========================================
// 🛠️ UTILITY FUNCTIONS
// ==========================================

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ==========================================
// 🧠 UI STORE IMPLEMENTATION
// ==========================================

export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // === INITIAL STATE ===
        isGlobalLoading: false,
        loadingStates: {},
        notifications: [],
        maxNotifications: 5,
        modals: [],
        theme: 'system',
        sidebarOpen: true,
        sidebarCollapsed: false,
        isMobile: false,

        // ==========================================
        // 🎯 LOADING ACTIONS IMPLEMENTATION
        // ==========================================

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

        clearAllLoading: () =>
          set((state) => {
            state.isGlobalLoading = false;
            state.loadingStates = {};
          }),

        // ==========================================
        // 🔔 NOTIFICATION ACTIONS IMPLEMENTATION
        // ==========================================

        addNotification: (notification) =>
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: generateId(),
              timestamp: Date.now(),
            };

            state.notifications.unshift(newNotification);

            // Limit number of notifications
            if (state.notifications.length > state.maxNotifications) {
              state.notifications = state.notifications.slice(0, state.maxNotifications);
            }

            // Auto-remove notification after duration
            if (notification.duration && notification.duration > 0) {
              setTimeout(() => {
                get().removeNotification(newNotification.id);
              }, notification.duration);
            }
          }),

        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== id);
          }),

        clearAllNotifications: () =>
          set((state) => {
            state.notifications = [];
          }),

        // ==========================================
        // 🪟 MODAL ACTIONS IMPLEMENTATION
        // ==========================================

        openModal: (modal) =>
          set((state) => {
            const newModal: Modal = {
              ...modal,
              id: generateId(),
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

        // ==========================================
        // 🎨 THEME ACTIONS IMPLEMENTATION
        // ==========================================

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
            
            // Apply theme to document
            if (typeof window !== 'undefined') {
              const root = window.document.documentElement;
              
              if (theme === 'dark') {
                root.classList.add('dark');
              } else if (theme === 'light') {
                root.classList.remove('dark');
              } else {
                // System theme
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDark) {
                  root.classList.add('dark');
                } else {
                  root.classList.remove('dark');
                }
              }
            }
          }),

        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },

        // ==========================================
        // 📱 SIDEBAR ACTIONS IMPLEMENTATION
        // ==========================================

        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        setSidebarCollapsed: (collapsed) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),

        toggleSidebarCollapse: () =>
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

        // ==========================================
        // 📱 MOBILE ACTIONS IMPLEMENTATION
        // ==========================================

        setIsMobile: (isMobile) =>
          set((state) => {
            state.isMobile = isMobile;
            
            // Auto-close sidebar on mobile
            if (isMobile) {
              state.sidebarOpen = false;
            }
          }),
      }))
    ),
    {
      name: 'ui-store',
    }
  )
);

// ==========================================
// 🎯 STORE SELECTORS
// ==========================================

export const uiSelectors = {
  // Loading selectors
  isGlobalLoading: (state: any) => state.isGlobalLoading,
  isLoading: (state: any) => (key: string) => state.isLoading(key),
  hasAnyLoading: (state: any) => Object.keys(state.loadingStates).length > 0,
  
  // Notification selectors
  getNotifications: (state: any) => state.notifications,
  getLatestNotification: (state: any) => state.notifications[0] || null,
  getNotificationCount: (state: any) => state.notifications.length,
  
  // Modal selectors
  getModals: (state: any) => state.modals,
  hasOpenModals: (state: any) => state.modals.length > 0,
  getTopModal: (state: any) => state.modals[state.modals.length - 1] || null,
  
  // Theme selectors
  getTheme: (state: any) => state.theme,
  isDark: (state: any) => state.theme === 'dark',
  
  // Sidebar selectors
  isSidebarOpen: (state: any) => state.sidebarOpen,
  isSidebarCollapsed: (state: any) => state.sidebarCollapsed,
  
  // Mobile selectors
  isMobile: (state: any) => state.isMobile,
};

// ==========================================
// 📤 CONVENIENCE HOOKS
// ==========================================

// Hook for notifications
export const useNotifications = () => {
  return useUIStore((state) => ({
    notifications: state.notifications,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearAllNotifications: state.clearAllNotifications,
  }));
};

// Hook for loading states
export const useLoadingStates = () => {
  return useUIStore((state) => ({
    isGlobalLoading: state.isGlobalLoading,
    setGlobalLoading: state.setGlobalLoading,
    setLoading: state.setLoading,
    isLoading: state.isLoading,
    clearAllLoading: state.clearAllLoading,
  }));
};

// Hook for modals
export const useModals = () => {
  return useUIStore((state) => ({
    modals: state.modals,
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,
  }));
};

// Hook for theme
export const useTheme = () => {
  return useUIStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
  }));
};

// Hook for sidebar
export const useSidebar = () => {
  return useUIStore((state) => ({
    isOpen: state.sidebarOpen,
    isCollapsed: state.sidebarCollapsed,
    setSidebarOpen: state.setSidebarOpen,
    toggleSidebar: state.toggleSidebar,
    setSidebarCollapsed: state.setSidebarCollapsed,
    toggleSidebarCollapse: state.toggleSidebarCollapse,
  }));
};