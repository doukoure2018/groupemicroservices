import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HttpCacheService {
    private httpResponseCache: Record<string, HttpResponse<any>> = {};

    /**
     * Caches the HttpResponse for the provided key.
     * @param key The cache key.
     * @param httpResponse The HttpResponse to cache.
     */
    put(key: string, httpResponse: HttpResponse<any>): void {
        if (!key || !httpResponse) {
            console.warn('Invalid key or response provided for caching.');
            return;
        }
        console.log('Caching response for key:', key);
        this.httpResponseCache[key] = httpResponse;
    }

    /**
     * Retrieves the cached HttpResponse for the provided key.
     * @param key The cache key.
     * @returns The cached HttpResponse or undefined if not found.
     */
    get(key: string): HttpResponse<any> | undefined {
        return this.httpResponseCache[key];
    }

    /**
     * Removes the cached HttpResponse for the provided key.
     * @param key The cache key.
     * @returns True if the key existed and was deleted, false otherwise.
     */
    evict(key: string): boolean {
        if (this.httpResponseCache[key]) {
            console.log('Evicting cache for key:', key);
            return delete this.httpResponseCache[key];
        }
        return false;
    }

    /**
     * Clears all cached HttpResponses.
     */
    evictAll(): void {
        console.log('Clearing entire cache');
        this.httpResponseCache = {};
    }

    /**
     * Logs the current state of the cache.
     */
    logCache(): void {
        console.log('Current cache state:', this.httpResponseCache);
    }
}
