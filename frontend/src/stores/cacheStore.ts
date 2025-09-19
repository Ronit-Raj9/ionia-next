// ==========================================
// 💾 CACHE STORE - API RESPONSE CACHING
// ==========================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// ==========================================
// 🏷️ CACHE TYPES & INTERFACES
// ==========================================

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  key: string;
  tags?: string[];
  size?: number;
}

export interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  maxMemory: number; // Maximum memory usage in bytes (approximate)
  enableCompression?: boolean;
  enablePersistence?: boolean;
}

interface CacheState {
  // === CACHE DATA ===
  entries: Map<string, CacheEntry>;
  totalSize: number;
  config: CacheConfig;
  
  // === STATS ===
  hits: number;
  misses: number;
  evictions: number;
  
  // ==========================================
  // 🎯 ACTIONS
  // ==========================================
  
  // Core Cache Operations
  get: (key: string) => any | null;
  set: (key: string, data: any, ttl?: number, tags?: string[]) => void;
  delete: (key: string) => boolean;
  clear: () => void;
  
  // Advanced Operations
  has: (key: string) => boolean;
  getSize: () => number;
  getStats: () => { hits: number; misses: number; evictions: number; hitRate: number };
  
  // Bulk Operations
  setMany: (entries: Array<{ key: string; data: any; ttl?: number; tags?: string[] }>) => void;
  deleteMany: (keys: string[]) => number;
  getMany: (keys: string[]) => Map<string, any>;
  
  // Tag-based Operations
  invalidateByTag: (tag: string) => number;
  invalidateByTags: (tags: string[]) => number;
  getByTag: (tag: string) => Map<string, any>;
  
  // Maintenance Operations
  cleanup: () => number;
  evictLRU: (count?: number) => number;
  
  // Configuration
  updateConfig: (config: Partial<CacheConfig>) => void;
  getConfig: () => CacheConfig;
}

// ==========================================
// 🛠️ UTILITY FUNCTIONS
// ==========================================

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  maxMemory: 10 * 1024 * 1024, // 10MB
  enableCompression: false,
  enablePersistence: false,
};

/**
 * Generate cache key from URL and options
 */
export const generateCacheKey = (url: string, options?: RequestInit): string => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  const searchParams = new URL(url, 'http://localhost').searchParams.toString();
  
  return `${method}:${url}:${searchParams}:${body}`.replace(/[^a-zA-Z0-9:]/g, '_');
};

/**
 * Estimate memory size of data (approximate)
 */
const estimateSize = (data: any): number => {
  try {
    return JSON.stringify(data).length * 2; // Rough estimate (2 bytes per character)
  } catch (error) {
    return 1024; // Default fallback
  }
};

/**
 * Check if cache entry is expired
 */
const isExpired = (entry: CacheEntry): boolean => {
  return Date.now() > entry.expiresAt;
};

/**
 * Create cache entry
 */
const createCacheEntry = (
  key: string,
  data: any,
  ttl: number,
  tags?: string[]
): CacheEntry => {
  const timestamp = Date.now();
  return {
    key,
    data,
    timestamp,
    expiresAt: timestamp + ttl,
    tags: tags || [],
    size: estimateSize(data),
  };
};

// ==========================================
// 🧠 CACHE STORE IMPLEMENTATION
// ==========================================

export const useCacheStore = create<CacheState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // === INITIAL STATE ===
        entries: new Map(),
        totalSize: 0,
        config: DEFAULT_CONFIG,
        hits: 0,
        misses: 0,
        evictions: 0,

        // ==========================================
        // 🎯 CORE CACHE OPERATIONS
        // ==========================================

        get: (key) => {
          const state = get();
          const entry = state.entries.get(key);
          
          if (!entry) {
            set((draft) => {
              draft.misses++;
            });
            return null;
          }
          
          if (isExpired(entry)) {
            set((draft) => {
              draft.entries.delete(key);
              draft.totalSize -= entry.size || 0;
              draft.misses++;
            });
            return null;
          }
          
          set((draft) => {
            draft.hits++;
          });
          
          return entry.data;
        },

        set: (key, data, ttl, tags) => {
          const state = get();
          const finalTTL = ttl || state.config.defaultTTL;
          const entry = createCacheEntry(key, data, finalTTL, tags);
          
          set((draft) => {
            // Remove existing entry if it exists
            const existingEntry = draft.entries.get(key);
            if (existingEntry) {
              draft.totalSize -= existingEntry.size || 0;
            }
            
            // Add new entry
            draft.entries.set(key, entry);
            draft.totalSize += entry.size || 0;
            
            // Check if we need to evict entries
            if (draft.entries.size > draft.config.maxSize) {
              const evicted = get().evictLRU(1);
              draft.evictions += evicted;
            }
            
            // Check memory usage
            if (draft.totalSize > draft.config.maxMemory) {
              const evicted = get().evictLRU(Math.ceil(draft.entries.size * 0.1)); // Evict 10%
              draft.evictions += evicted;
            }
          });
        },

        delete: (key) => {
          const state = get();
          const entry = state.entries.get(key);
          
          if (!entry) {
            return false;
          }
          
          set((draft) => {
            draft.entries.delete(key);
            draft.totalSize -= entry.size || 0;
          });
          
          return true;
        },

        clear: () =>
          set((draft) => {
            draft.entries.clear();
            draft.totalSize = 0;
            draft.hits = 0;
            draft.misses = 0;
            draft.evictions = 0;
          }),

        // ==========================================
        // 🔍 QUERY OPERATIONS
        // ==========================================

        has: (key) => {
          const state = get();
          const entry = state.entries.get(key);
          return entry ? !isExpired(entry) : false;
        },

        getSize: () => {
          const state = get();
          return state.entries.size;
        },

        getStats: () => {
          const state = get();
          const total = state.hits + state.misses;
          return {
            hits: state.hits,
            misses: state.misses,
            evictions: state.evictions,
            hitRate: total > 0 ? state.hits / total : 0,
          };
        },

        // ==========================================
        // 🔄 BULK OPERATIONS
        // ==========================================

        setMany: (entries) => {
          entries.forEach(({ key, data, ttl, tags }) => {
            get().set(key, data, ttl, tags);
          });
        },

        deleteMany: (keys) => {
          let deleted = 0;
          keys.forEach((key) => {
            if (get().delete(key)) {
              deleted++;
            }
          });
          return deleted;
        },

        getMany: (keys) => {
          const result = new Map();
          keys.forEach((key) => {
            const data = get().get(key);
            if (data !== null) {
              result.set(key, data);
            }
          });
          return result;
        },

        // ==========================================
        // 🏷️ TAG-BASED OPERATIONS
        // ==========================================

        invalidateByTag: (tag) => {
          const state = get();
          let invalidated = 0;
          
          const keysToDelete: string[] = [];
          
          state.entries.forEach((entry, key) => {
            if (entry.tags && entry.tags.includes(tag)) {
              keysToDelete.push(key);
            }
          });
          
          invalidated = get().deleteMany(keysToDelete);
          return invalidated;
        },

        invalidateByTags: (tags) => {
          let totalInvalidated = 0;
          tags.forEach((tag) => {
            totalInvalidated += get().invalidateByTag(tag);
          });
          return totalInvalidated;
        },

        getByTag: (tag) => {
          const state = get();
          const result = new Map();
          
          state.entries.forEach((entry, key) => {
            if (entry.tags && entry.tags.includes(tag) && !isExpired(entry)) {
              result.set(key, entry.data);
            }
          });
          
          return result;
        },

        // ==========================================
        // 🧹 MAINTENANCE OPERATIONS
        // ==========================================

        cleanup: () => {
          const state = get();
          let cleaned = 0;
          
          const keysToDelete: string[] = [];
          
          state.entries.forEach((entry, key) => {
            if (isExpired(entry)) {
              keysToDelete.push(key);
            }
          });
          
          cleaned = get().deleteMany(keysToDelete);
          return cleaned;
        },

        evictLRU: (count = 1) => {
          const state = get();
          
          if (state.entries.size === 0) {
            return 0;
          }
          
          // Sort entries by timestamp (oldest first)
          const sortedEntries = Array.from(state.entries.entries()).sort(
            (a, b) => a[1].timestamp - b[1].timestamp
          );
          
          const toEvict = sortedEntries.slice(0, count);
          const keysToDelete = toEvict.map(([key]) => key);
          
          return get().deleteMany(keysToDelete);
        },

        // ==========================================
        // ⚙️ CONFIGURATION
        // ==========================================

        updateConfig: (newConfig) =>
          set((draft) => {
            draft.config = { ...draft.config, ...newConfig };
          }),

        getConfig: () => {
          const state = get();
          return { ...state.config };
        },
      }))
    ),
    {
      name: 'cache-store',
    }
  )
);

// ==========================================
// 🎯 STORE SELECTORS
// ==========================================

export const cacheSelectors = {
  // Basic selectors
  getEntryCount: (state: any) => state.entries.size,
  getTotalSize: (state: any) => state.totalSize,
  getConfig: (state: any) => state.config,
  getStats: (state: any) => state.getStats(),
  
  // Memory usage
  getMemoryUsage: (state: any) => ({
    used: state.totalSize,
    max: state.config.maxMemory,
    percentage: (state.totalSize / state.config.maxMemory) * 100,
  }),
  
  // Cache efficiency
  getCacheEfficiency: (state: any) => {
    const stats = state.getStats();
    return {
      hitRate: stats.hitRate,
      missRate: 1 - stats.hitRate,
      efficiency: stats.hitRate > 0.8 ? 'excellent' : 
                 stats.hitRate > 0.6 ? 'good' : 
                 stats.hitRate > 0.4 ? 'fair' : 'poor',
    };
  },
};

// ==========================================
// 📤 CONVENIENCE HOOKS
// ==========================================

// Hook for basic cache operations
export const useCache = () => {
  return useCacheStore((state) => ({
    get: state.get,
    set: state.set,
    delete: state.delete,
    clear: state.clear,
    has: state.has,
  }));
};

// Hook for cache statistics
export const useCacheStats = () => {
  return useCacheStore((state) => ({
    stats: state.getStats(),
    size: state.getSize(),
    totalSize: state.totalSize,
    config: state.getConfig(),
  }));
};

// Hook for cache maintenance
export const useCacheMaintenance = () => {
  return useCacheStore((state) => ({
    cleanup: state.cleanup,
    evictLRU: state.evictLRU,
    invalidateByTag: state.invalidateByTag,
    invalidateByTags: state.invalidateByTags,
  }));
};

// ==========================================
// ⏰ AUTO-CLEANUP UTILITY
// ==========================================

// Start automatic cleanup interval (call this in your app initialization)
export const startCacheCleanup = (intervalMs: number = 60000) => {
  if (typeof window === 'undefined') return;
  
  const cleanup = () => {
    const { cleanup: cleanupExpired } = useCacheStore.getState();
    const cleaned = cleanupExpired();
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  };
  
  // Initial cleanup
  cleanup();
  
  // Set up interval
  const intervalId = setInterval(cleanup, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};