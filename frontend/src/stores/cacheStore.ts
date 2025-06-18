import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CacheState {
  cache: Record<string, CacheItem>;
  
  // Actions
  set: (key: string, data: any, ttl?: number) => void;
  get: (key: string) => any | null;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
  invalidatePattern: (pattern: string | RegExp) => void;
  invalidateByTags: (tags: string[]) => void;
  cleanup: () => void;
  getStats: () => { total: number; expired: number; active: number };
}

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Cache invalidation patterns
const CACHE_PATTERNS = {
  USER: /^(user|profile|auth)/,
  ADMIN: /^admin/,
  TESTS: /^(tests|test-results)/,
  QUESTIONS: /^questions/,
  ALL: /.*/,
};

export const useCacheStore = create<CacheState>()(
  immer((set, get) => ({
    cache: {},

    set: (key, data, ttl = DEFAULT_TTL) =>
      set((state) => {
        state.cache[key] = {
          data,
          timestamp: Date.now(),
          ttl,
          key,
        };
      }),

    get: (key) => {
      const state = get();
      const item = state.cache[key];
      
      if (!item) return null;
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        // Remove expired item
        state.delete(key);
        return null;
      }
      
      return item.data;
    },

    has: (key) => {
      const state = get();
      const item = state.cache[key];
      
      if (!item) return false;
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        state.delete(key);
        return false;
      }
      
      return true;
    },

    delete: (key) =>
      set((state) => {
        delete state.cache[key];
      }),

    clear: () =>
      set((state) => {
        state.cache = {};
      }),

    invalidatePattern: (pattern) =>
      set((state) => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        
        Object.keys(state.cache).forEach((key) => {
          if (regex.test(key)) {
            delete state.cache[key];
          }
        });
      }),

    invalidateByTags: (tags) =>
      set((state) => {
        tags.forEach((tag) => {
          const pattern = CACHE_PATTERNS[tag.toUpperCase() as keyof typeof CACHE_PATTERNS];
          if (pattern) {
            Object.keys(state.cache).forEach((key) => {
              if (pattern.test(key)) {
                delete state.cache[key];
              }
            });
          }
        });
      }),

    cleanup: () =>
      set((state) => {
        const now = Date.now();
        Object.keys(state.cache).forEach((key) => {
          const item = state.cache[key];
          if (now - item.timestamp > item.ttl) {
            delete state.cache[key];
          }
        });
      }),

    getStats: () => {
      const state = get();
      const now = Date.now();
      const items = Object.values(state.cache);
      
      return {
        total: items.length,
        expired: items.filter(item => now - item.timestamp > item.ttl).length,
        active: items.filter(item => now - item.timestamp <= item.ttl).length,
      };
    },
  }))
);

// Helper function to generate cache keys
export const generateCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  // Sort params for consistent key generation
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);
  
  const paramString = new URLSearchParams(sortedParams).toString();
  return `${endpoint}?${paramString}`;
};

// Auto-cleanup expired cache items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().cleanup();
  }, 5 * 60 * 1000);
}

// Helper hooks
export const useCache = () => {
  const { set, get, has, delete: del, clear, invalidatePattern, invalidateByTags } = useCacheStore();
  
  return {
    setCache: set,
    getCache: get,
    hasCache: has,
    deleteCache: del,
    clearCache: clear,
    invalidateCache: invalidatePattern,
    invalidateByTags,
  };
};

// Predefined cache invalidation functions
export const invalidateUserCache = () => {
  useCacheStore.getState().invalidateByTags(['USER']);
};

export const invalidateAdminCache = () => {
  useCacheStore.getState().invalidateByTags(['ADMIN']);
};

export const invalidateTestCache = () => {
  useCacheStore.getState().invalidateByTags(['TESTS']);
};

export const invalidateAllCache = () => {
  useCacheStore.getState().clear();
}; 
 
 