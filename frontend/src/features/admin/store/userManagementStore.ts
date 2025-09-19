import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { UserManagementService } from '../services/userManagementService';
import { createErrorState } from '../utils/errorHandling';
import type { 
  User, 
  PaginatedUsers,
  UserAnalytics
} from '../types';

interface UserManagementState {
  // Users list
  users: User[];
  usersPagination: Omit<PaginatedUsers, 'docs'> | null;
  selectedUser: User | null;
  
  // Current filters and pagination state
  currentFilters: {
    search: string;
    role: string;
    status: string;
    page: number;
    limit: number;
  };
  
  // Analytics
  userAnalytics: UserAnalytics | null;
  
  // Loading states
  loading: Set<string>; // To track multiple loading states
  
  // Error states
  error: { [key: string]: string | null };
}

interface UserManagementActions {
  // ==========================================
  // 👥 USER MANAGEMENT ACTIONS
  // ==========================================
  fetchUsers: (queryParams?: string) => Promise<void>;
  fetchUserDetails: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'user' | 'admin') => Promise<void>;
  
  // ==========================================
  // 📄 PAGINATION ACTIONS
  // ==========================================
  goToNextPage: () => Promise<void>;
  goToPreviousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setFilters: (filters: Partial<UserManagementState['currentFilters']>) => void;
  
  // ==========================================
  // 📊 USER ANALYTICS ACTIONS
  // ==========================================
  fetchUserAnalytics: () => Promise<void>;
  
  // ==========================================
  // 🧹 UTILITY ACTIONS
  // ==========================================
  clearError: (key: string) => void;
  setSelectedUser: (user: User | null) => void;
  clearUsers: () => void;
}

export const useUserManagementStore = create<UserManagementState & UserManagementActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      users: [],
      usersPagination: null,
      selectedUser: null,
      currentFilters: {
        search: '',
        role: '',
        status: '',
        page: 1,
        limit: 10
      },
      userAnalytics: null,
      loading: new Set(),
      error: {},

      // ==========================================
      // 👥 USER MANAGEMENT ACTIONS IMPLEMENTATION
      // ==========================================

      fetchUsers: async (queryParams?: string) => {
        const state = get();
        set((state) => {
          state.loading.add('users');
          state.error['users'] = null;
        });
        
        try {
          // Use provided queryParams or build from current filters
          let params = queryParams;
          if (!params) {
            const { search, role, status, page, limit } = state.currentFilters;
            const urlParams = new URLSearchParams();
            
            if (search) urlParams.append('search', search);
            if (role) urlParams.append('role', role);
            if (status) urlParams.append('status', status);
            urlParams.append('page', page.toString());
            urlParams.append('limit', limit.toString());
            
            params = urlParams.toString();
          }
          
          const data = await UserManagementService.getUsers(params);
          set((state) => {
            state.users = data.docs;
            const { docs, ...paginationInfo } = data;
            state.usersPagination = paginationInfo;
          });
        } catch (err: any) {
          set((state) => {
            state.error['users'] = err.message || 'Failed to load users.';
          });
        } finally {
          set((state) => {
            state.loading.delete('users');
          });
        }
      },

      fetchUserDetails: async (userId: string) => {
        set((state) => {
          state.loading.add('userDetails');
          state.error['userDetails'] = null;
        });
        try {
          const data = await UserManagementService.getUserDetails(userId);
          set((state) => {
            state.selectedUser = data;
          });
        } catch (err: any) {
          set((state) => {
            state.error['userDetails'] = err.message || 'Failed to load user details.';
          });
        } finally {
          set((state) => {
            state.loading.delete('userDetails');
          });
        }
      },

      updateUserRole: async (userId: string, role: 'user' | 'admin') => {
        set((state) => {
          state.loading.add('updateUserRole');
          state.error['updateUserRole'] = null;
        });
        try {
          const updatedUser = await UserManagementService.updateUserRole(userId, role);
          set((state) => {
            // Update user in the list
            const userIndex = state.users.findIndex(u => u._id === userId);
            if (userIndex !== -1) {
              state.users[userIndex] = updatedUser;
            }
            // Update selected user if it's the same
            if (state.selectedUser?._id === userId) {
              state.selectedUser = updatedUser;
            }
          });
        } catch (err: any) {
          set((state) => {
            state.error['updateUserRole'] = err.message || 'Failed to update user role.';
          });
        } finally {
          set((state) => {
            state.loading.delete('updateUserRole');
          });
        }
      },

      // ==========================================
      // 📄 PAGINATION ACTIONS IMPLEMENTATION
      // ==========================================

      goToNextPage: async () => {
        const state = get();
        if (state.usersPagination?.hasNextPage) {
          set((state) => {
            state.currentFilters.page += 1;
          });
          await get().fetchUsers();
        }
      },

      goToPreviousPage: async () => {
        const state = get();
        if (state.usersPagination?.hasPrevPage) {
          set((state) => {
            state.currentFilters.page = Math.max(1, state.currentFilters.page - 1);
          });
          await get().fetchUsers();
        }
      },

      goToPage: async (page: number) => {
        const state = get();
        if (page >= 1 && page <= (state.usersPagination?.totalPages || 1)) {
          set((state) => {
            state.currentFilters.page = page;
          });
          await get().fetchUsers();
        }
      },

      setFilters: (filters) => {
        set((state) => {
          // Reset page to 1 when filters change
          state.currentFilters = {
            ...state.currentFilters,
            ...filters,
            page: filters.page || 1
          };
        });
        // Automatically fetch users with new filters
        get().fetchUsers();
      },

      // ==========================================
      // 📊 USER ANALYTICS ACTIONS IMPLEMENTATION
      // ==========================================

      fetchUserAnalytics: async () => {
        set((state) => {
          state.loading.add('userAnalytics');
          state.error['userAnalytics'] = null;
        });
        try {
          const data = await UserManagementService.getUsersAnalytics();
          set((state) => {
            state.userAnalytics = data;
          });
        } catch (err: any) {
          set((state) => {
            Object.assign(state.error, createErrorState('userAnalytics', err));
          });
        } finally {
          set((state) => {
            state.loading.delete('userAnalytics');
          });
        }
      },

      // ==========================================
      // 🧹 UTILITY ACTIONS IMPLEMENTATION
      // ==========================================

      clearError: (key: string) => {
        set((state) => {
          state.error[key] = null;
        });
      },

      setSelectedUser: (user: User | null) => {
        set((state) => {
          state.selectedUser = user;
        });
      },

      clearUsers: () => {
        set((state) => {
          state.users = [];
          state.usersPagination = null;
          state.selectedUser = null;
        });
      },
    }))
  )
);

