import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { compress, decompress } from 'lz-string';

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  COMPRESSION_THRESHOLD: 1024, // 1KB
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
  PRELOAD_CACHE_SIZE: 10, // Number of items to preload
};

// Cache strategies
export type CacheStrategy = 
  | 'cache-first'      // Serve from cache if available, fallback to network
  | 'network-first'    // Try network first, fallback to cache
  | 'cache-only'       // Only serve from cache
  | 'network-only'     // Always fetch from network
  | 'stale-while-revalidate'; // Serve stale content while fetching fresh

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  size: number;
  accessCount: number;
  lastAccessed: number;
  strategy: CacheStrategy;
  tags: string[];
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  size: number;
  itemCount: number;
  compressionRatio: number;
  avgAccessTime: number;
}

interface CacheState {
  // Cache storage
  cache: Map<string, CacheItem>;
  
  // Metrics
  metrics: CacheMetrics;
  
  // Configuration
  config: typeof CACHE_CONFIG;
  
  // Actions
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, options?: CacheOptions) => void;
  remove: (key: string) => void;
  clear: () => void;
  cleanup: () => void;
  
  // Advanced operations
  invalidateByTag: (tag: string) => void;
  preload: (keys: string[]) => Promise<void>;
  compress: (data: any) => string;
  decompress: (data: string) => any;
  
  // Metrics
  getMetrics: () => CacheMetrics;
  updateMetrics: (operation: 'hit' | 'miss', size?: number) => void;
  
  // Cache strategies
  getCacheStrategy: (key: string) => CacheStrategy;
  setCacheStrategy: (key: string, strategy: CacheStrategy) => void;
}

export interface CacheOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  tags?: string[];
  compress?: boolean;
}

// Generate cache key with parameters
export function generateCacheKey(url: string, params?: Record<string, any>): string {
  const baseKey = url.replace(/[^a-zA-Z0-9]/g, '_');
  if (!params) return baseKey;
  
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${baseKey}_${btoa(paramString).replace(/[^a-zA-Z0-9]/g, '')}`;
}

// Check if item is expired
function isExpired(item: CacheItem): boolean {
  return Date.now() - item.timestamp > item.ttl;
}

// Calculate size of data
function calculateSize(data: any): number {
  return new Blob([JSON.stringify(data)]).size;
}

// Compression utilities
function shouldCompress(data: any, threshold: number): boolean {
  const size = calculateSize(data);
  return size > threshold;
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      cache: new Map(),
      
      metrics: {
        hits: 0,
        misses: 0,
        size: 0,
        itemCount: 0,
        compressionRatio: 0,
        avgAccessTime: 0,
      },
      
      config: CACHE_CONFIG,
      
      get: <T>(key: string): T | null => {
        const startTime = performance.now();
        const state = get();
        const item = state.cache.get(key);
        
        if (!item) {
          state.updateMetrics('miss');
          return null;
        }
        
        // Check if expired
        if (isExpired(item)) {
          state.remove(key);
          state.updateMetrics('miss');
          return null;
        }
        
        // Update access statistics
        item.accessCount++;
        item.lastAccessed = Date.now();
        
        // Decompress if needed
        let data = item.data;
        if (item.compressed && typeof data === 'string') {
          data = state.decompress(data);
        }
        
        const accessTime = performance.now() - startTime;
        state.updateMetrics('hit', accessTime);
        
        return data as T;
      },
      
      set: <T>(key: string, data: T, options: CacheOptions = {}): void => {
        const state = get();
        const {
          ttl = state.config.DEFAULT_TTL,
          strategy = 'cache-first',
          tags = [],
          compress = shouldCompress(data, state.config.COMPRESSION_THRESHOLD)
        } = options;
        
        let processedData: any = data;
        let compressed = false;
        
        // Compress if needed
        if (compress && data) {
          processedData = state.compress(data);
          compressed = true;
        }
        
        const size = calculateSize(processedData);
        
        // Check cache size limit
        if (state.metrics.size + size > state.config.MAX_CACHE_SIZE) {
          state.cleanup();
        }
        
        const item: CacheItem<T> = {
          data: processedData,
          timestamp: Date.now(),
          ttl,
          compressed,
          size,
          accessCount: 0,
          lastAccessed: Date.now(),
          strategy,
          tags,
        };
        
        set((draft) => {
          draft.cache.set(key, item);
          draft.metrics.size += size;
          draft.metrics.itemCount++;
        });
      },
      
      remove: (key: string): void => {
        set((draft) => {
          const item = draft.cache.get(key);
          if (item) {
            draft.cache.delete(key);
            draft.metrics.size -= item.size;
            draft.metrics.itemCount--;
          }
        });
      },
      
      clear: (): void => {
        set((draft) => {
          draft.cache.clear();
          draft.metrics.size = 0;
          draft.metrics.itemCount = 0;
        });
      },
      
      cleanup: (): void => {
        const state = get();
        const now = Date.now();
        const itemsToRemove: string[] = [];
        
        // Find expired items and least recently used items
        const items = Array.from(state.cache.entries())
          .map(([key, item]) => ({
            key,
            item,
            expired: isExpired(item),
            score: item.accessCount / Math.max(1, now - item.lastAccessed)
          }))
          .sort((a, b) => {
            // Prioritize expired items for removal
            if (a.expired && !b.expired) return -1;
            if (!a.expired && b.expired) return 1;
            // Then sort by usage score (lower = remove first)
            return a.score - b.score;
          });
        
        let freedSize = 0;
        const targetSize = state.config.MAX_CACHE_SIZE * 0.8; // Free up to 80% capacity
        
        for (const { key, item } of items) {
          if (state.metrics.size - freedSize <= targetSize && !item.expired) {
            break;
          }
          
          itemsToRemove.push(key);
          freedSize += item.size;
        }
        
        // Remove items
        set((draft) => {
          itemsToRemove.forEach(key => {
            const item = draft.cache.get(key);
            if (item) {
              draft.cache.delete(key);
              draft.metrics.size -= item.size;
              draft.metrics.itemCount--;
            }
          });
        });
        
        console.log(`Cache cleanup: removed ${itemsToRemove.length} items, freed ${freedSize} bytes`);
      },
      
      invalidateByTag: (tag: string): void => {
        set((draft) => {
          const toRemove: string[] = [];
          
          draft.cache.forEach((item, key) => {
            if (item.tags.includes(tag)) {
              toRemove.push(key);
            }
          });
          
          toRemove.forEach(key => {
            const item = draft.cache.get(key);
            if (item) {
              draft.cache.delete(key);
              draft.metrics.size -= item.size;
              draft.metrics.itemCount--;
            }
          });
        });
      },
      
      preload: async (keys: string[]): Promise<void> => {
        // This would integrate with the API layer to preload data
        console.log('Preloading cache keys:', keys);
      },
      
      compress: (data: any): string => {
        try {
          return compress(JSON.stringify(data));
        } catch (error) {
          console.error('Compression failed:', error);
          return JSON.stringify(data);
        }
      },
      
      decompress: (data: string): any => {
        try {
          const decompressed = decompress(data);
          return decompressed ? JSON.parse(decompressed) : JSON.parse(data);
        } catch (error) {
          console.error('Decompression failed:', error);
          return data;
        }
      },
      
      getMetrics: (): CacheMetrics => {
        return get().metrics;
      },
      
      updateMetrics: (operation: 'hit' | 'miss', accessTime?: number): void => {
        set((draft) => {
          if (operation === 'hit') {
            draft.metrics.hits++;
            if (accessTime) {
              const totalTime = draft.metrics.avgAccessTime * draft.metrics.hits;
              draft.metrics.avgAccessTime = (totalTime + accessTime) / (draft.metrics.hits + 1);
            }
          } else {
            draft.metrics.misses++;
          }
        });
      },
      
      getCacheStrategy: (key: string): CacheStrategy => {
        const item = get().cache.get(key);
        return item?.strategy || 'cache-first';
      },
      
      setCacheStrategy: (key: string, strategy: CacheStrategy): void => {
        set((draft) => {
          const item = draft.cache.get(key);
          if (item) {
            item.strategy = strategy;
            draft.cache.set(key, item);
          }
        });
      },
    }),
    {
      name: 'cache-storage',
      // Don't persist the actual cache data, only configuration
      partialize: (state) => ({
        config: state.config,
        metrics: state.metrics,
      }),
    }
  )
);

// Service Worker integration
export class CacheServiceWorker {
  private static instance: CacheServiceWorker;
  private worker: ServiceWorker | null = null;
  
  private constructor() {
    this.registerServiceWorker();
  }
  
  static getInstance(): CacheServiceWorker {
    if (!CacheServiceWorker.instance) {
      CacheServiceWorker.instance = new CacheServiceWorker();
    }
    return CacheServiceWorker.instance;
  }
  
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.worker = registration.active;
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));
        
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  private handleMessage(event: MessageEvent): void {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'CACHE_HIT':
        console.log('Service Worker cache hit:', payload.url);
        break;
      case 'CACHE_MISS':
        console.log('Service Worker cache miss:', payload.url);
        break;
      case 'CACHE_UPDATED':
        // Invalidate related cache entries
        const { invalidateByTag } = useCacheStore.getState();
        invalidateByTag(payload.tag);
        break;
    }
  }
  
  async cacheRequest(url: string, strategy: CacheStrategy = 'cache-first'): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({
        type: 'CACHE_REQUEST',
        payload: { url, strategy }
      });
    }
  }
  
  async invalidateCache(pattern: string): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({
        type: 'INVALIDATE_CACHE',
        payload: { pattern }
      });
    }
  }
}

// Cache warming utility
export class CacheWarmer {
  private static criticalRoutes = [
    '/api/v1/users/profile',
    '/api/v1/tests',
    '/api/v1/dashboard/stats'
  ];
  
  static async warmCache(): Promise<void> {
    const { set } = useCacheStore.getState();
    
    console.log('Starting cache warming...');
    
    for (const route of this.criticalRoutes) {
      try {
        // This would be integrated with your API layer
        // const data = await API.get(route);
        // set(generateCacheKey(route), data, { ttl: 10 * 60 * 1000 }); // 10 minutes
        console.log(`Cache warmed for: ${route}`);
      } catch (error) {
        console.error(`Cache warming failed for ${route}:`, error);
      }
    }
  }
  
  static scheduleWarming(): void {
    // Warm cache on app start
    setTimeout(this.warmCache, 1000);
    
    // Re-warm cache every hour
    setInterval(this.warmCache, 60 * 60 * 1000);
  }
}

// Automatic cleanup scheduler
export function startCacheCleanup(): void {
  const { cleanup } = useCacheStore.getState();
  
  setInterval(() => {
    cleanup();
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
}

// Cache performance monitoring
export function getCachePerformanceReport(): {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  avgAccessTime: number;
  cacheSize: string;
  topKeys: string[];
} {
  const { cache, metrics } = useCacheStore.getState();
  const totalRequests = metrics.hits + metrics.misses;
  
  // Get top accessed keys
  const topKeys = Array.from(cache.entries())
    .sort(([, a], [, b]) => b.accessCount - a.accessCount)
    .slice(0, 10)
    .map(([key]) => key);
  
  return {
    hitRate: totalRequests > 0 ? (metrics.hits / totalRequests) * 100 : 0,
    missRate: totalRequests > 0 ? (metrics.misses / totalRequests) * 100 : 0,
    totalRequests,
    avgAccessTime: metrics.avgAccessTime,
    cacheSize: `${(metrics.size / 1024 / 1024).toFixed(2)} MB`,
    topKeys
  };
}

// Initialize cache system
export function initializeCacheSystem(): void {
  if (typeof window !== 'undefined') {
    // Start cleanup scheduler
    startCacheCleanup();
    
    // Initialize service worker
    CacheServiceWorker.getInstance();
    
    // Schedule cache warming
    CacheWarmer.scheduleWarming();
    
    // Log cache performance periodically
    setInterval(() => {
      const report = getCachePerformanceReport();
      console.log('Cache Performance Report:', report);
    }, 5 * 60 * 1000); // Every 5 minutes
  }
} 