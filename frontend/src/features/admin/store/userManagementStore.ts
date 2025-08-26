import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import * as UserManagementAPI from '../api/userManagementApi';
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
      userAnalytics: null,
      loading: new Set(),
      error: {},

      // ==========================================
      // 👥 USER MANAGEMENT ACTIONS IMPLEMENTATION
      // ==========================================

      fetchUsers: async (queryParams: string = '') => {
        set((state) => {
          state.loading.add('users');
          state.error['users'] = null;
        });
        try {
          const data = await UserManagementAPI.getUsers(queryParams);
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
          const data = await UserManagementAPI.getUserDetails(userId);
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
          const updatedUser = await UserManagementAPI.updateUserRole(userId, role);
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
      // 📊 USER ANALYTICS ACTIONS IMPLEMENTATION
      // ==========================================

      fetchUserAnalytics: async () => {
        set((state) => {
          state.loading.add('userAnalytics');
          state.error['userAnalytics'] = null;
        });
        try {
          const data = await UserManagementAPI.getUsersAnalytics();
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

