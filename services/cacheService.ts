// src/services/cacheService.ts
import { FirestoreDataCache } from '@/types/session.types';

// Cache duration in milliseconds (5 minutes default)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

// We'll use this to store data in memory even when the component unmounts
// This helps maintain data when navigating between pages
let globalCache: Map<string, FirestoreDataCache<any>> = new Map();
let pendingFetches: Map<string, boolean> = new Map();

/**
 * A singleton service to manage data caching across the application
 */
class CacheService {
  private static instance: CacheService;

  private constructor() {
    // Initialize with the global references, but don't recreate them
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get cached data if it exists and is not expired
   * @param key The cache key
   * @param maxAge Optional override for cache duration
   * @returns The cached data or null if not found or expired
   */
  public get<T>(key: string, maxAge?: number): T | null {
    const cachedItem = globalCache.get(key);
    if (!cachedItem) return null;

    const now = Date.now();
    const cacheAge = now - cachedItem.timestamp;
    const cacheDuration = maxAge ?? DEFAULT_CACHE_DURATION;

    // Check if cache is still valid
    if (cacheAge < cacheDuration) {
      return cachedItem.data as T;
    }

    // Cache expired, remove it
    globalCache.delete(key);
    return null;
  }

  /**
   * Set data in the cache with the current timestamp
   * @param key The cache key
   * @param data The data to cache
   */
  public set<T>(key: string, data: T): void {
    globalCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove an item from the cache
   * @param key The cache key
   */
  public remove(key: string): void {
    globalCache.delete(key);
  }

  /**
   * Mark a fetch operation as pending
   * @param key The fetch operation key
   */
  public setPending(key: string): boolean {
    if (pendingFetches.get(key)) {
      return false; // Already pending
    }
    pendingFetches.set(key, true);
    return true;
  }

  /**
   * Clear a pending fetch operation
   * @param key The fetch operation key
   */
  public clearPending(key: string): void {
    pendingFetches.delete(key);
  }

  /**
   * Check if a fetch operation is pending
   * @param key The fetch operation key
   */
  public isPending(key: string): boolean {
    return pendingFetches.get(key) ?? false;
  }

  /**
   * Clear all cached data
   */
  public clearAll(): void {
    globalCache.clear();
    pendingFetches.clear();
  }

  /**
   * Clear all cached data with keys matching the provided pattern
   * @param pattern RegExp pattern to match cache keys
   */
  public clearByPattern(pattern: RegExp): void {
    globalCache.forEach((_, key) => {
      if (pattern.test(key)) {
        globalCache.delete(key);
      }
    });
  }

  /**
   * Get cache keys matching a pattern
   * @param pattern RegExp pattern to match cache keys
   * @returns Array of matching cache keys
   */
  public getKeys(pattern?: RegExp): string[] {
    const keys: string[] = [];
    globalCache.forEach((_, key) => {
      if (!pattern || pattern.test(key)) {
        keys.push(key);
      }
    });
    return keys;
  }
  
  /**
   * Get cache item metadata
   * @returns Object with cache statistics
   */
  public getStats() {
    return {
      totalItems: globalCache.size,
      pendingOperations: pendingFetches.size,
      averageAge: this.getAverageAge(),
      oldestItem: this.getOldestItem(),
    };
  }
  
  /**
   * Calculate the average age of cached items
   * @returns Average age in milliseconds
   */
  private getAverageAge(): number {
    if (globalCache.size === 0) return 0;
    
    const now = Date.now();
    let totalAge = 0;
    
    globalCache.forEach(item => {
      totalAge += now - item.timestamp;
    });
    
    return totalAge / globalCache.size;
  }
  
  /**
   * Get the oldest item in the cache
   * @returns Object with key and age of oldest item
   */
  private getOldestItem(): { key: string; age: number } | null {
    if (globalCache.size === 0) return null;
    
    const now = Date.now();
    let oldestKey = '';
    let oldestAge = 0;
    
    globalCache.forEach((item, key) => {
      const age = now - item.timestamp;
      if (age > oldestAge) {
        oldestAge = age;
        oldestKey = key;
      }
    });
    
    return { key: oldestKey, age: oldestAge };
  }
}

// Export a singleton instance
export const cacheService = CacheService.getInstance();

// Helper functions for working with specific data types
export const createCacheKey = (collection: string, id?: string, query?: string): string => {
  return id 
    ? `${collection}/${id}${query ? `?${query}` : ''}`
    : `${collection}${query ? `?${query}` : ''}`;
};