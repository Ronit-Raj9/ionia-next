import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import * as AdminAPI from '../api/adminApi';
import type { AdminAnalytics, User, UserAnalytics, PaginatedUsers } from '../types';

interface AdminState {
  analytics: AdminAnalytics | null;
  userAnalytics: UserAnalytics | null;
  users: User[];
  pagination: Omit<PaginatedUsers, 'docs'> | null;
  loading: Set<string>; // To track multiple loading states
  error: { [key: string]: string | null };
}

interface AdminActions {
  fetchAdminAnalytics: () => Promise<void>;
  fetchUserAnalytics: () => Promise<void>;
  fetchUsers: (queryParams: string) => Promise<void>;
  clearError: (key: string) => void;
}

export const useAdminStore = create<AdminState & AdminActions>()(
  devtools(
    immer((set) => ({
      analytics: null,
      userAnalytics: null,
      users: [],
      pagination: null,
      loading: new Set(),
      error: {},

      fetchAdminAnalytics: async () => {
        set((state) => {
          state.loading.add('analytics');
          state.error['analytics'] = null;
        });
        try {
          const data = await AdminAPI.getAdminAnalytics();
          set((state) => {
            state.analytics = data;
          });
        } catch (err) {
          set((state) => {
            state.error['analytics'] = 'Failed to load admin analytics.';
          });
        } finally {
          set((state) => {
            state.loading.delete('analytics');
          });
        }
      },

      fetchUserAnalytics: async () => {
        set((state) => {
          state.loading.add('userAnalytics');
          state.error['userAnalytics'] = null;
        });
        try {
          const data = await AdminAPI.getUserAnalytics();
          set((state) => {
            state.userAnalytics = data;
          });
        } catch (err) {
          set((state) => {
            state.error['userAnalytics'] = 'Failed to load user analytics.';
          });
        } finally {
          set((state) => {
            state.loading.delete('userAnalytics');
          });
        }
      },

      fetchUsers: async (queryParams: string) => {
        set((state) => {
          state.loading.add('users');
          state.error['users'] = null;
        });
        try {
          const data = await AdminAPI.getUsers(queryParams);
          set((state) => {
            state.users = data.docs;
            const { docs, ...paginationInfo } = data;
            state.pagination = paginationInfo;
          });
        } catch (err) {
          set((state) => {
            state.error['users'] = 'Failed to load users.';
          });
        } finally {
          set((state) => {
            state.loading.delete('users');
          });
        }
      },
      
      clearError: (key: string) => {
        set((state) => {
            state.error[key] = null;
        });
      },
    }))
  )
);
