'use client';

import { 
  QueryClient, 
  QueryClientProvider,
  useQuery as useReactQuery,
  useMutation as useReactMutation,
  useQueryClient as useReactQueryClient,
  useInfiniteQuery as useReactInfiniteQuery,
  QueryObserverOptions,
  UseQueryResult
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { cacheService } from '@/services/cacheService';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Default stale time for queries (5 minutes)
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Create a React Query Provider with optimized settings for Firebase
 */
export function ReactQueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME,
            refetchOnWindowFocus: false,
            retry: 1,
            // Integrate default cache handling
            gcTime: DEFAULT_STALE_TIME * 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

/**
 * Hook factory to create Firebase query hooks with React Query
 */
export function createFirebaseQueryHook<TResult, TParams extends unknown[]>(
  queryFn: (...params: TParams) => Promise<TResult>,
  getQueryKey: (...params: TParams) => string[],
  options: {
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const { staleTime = DEFAULT_STALE_TIME, enabled = true } = options;

  return function useFirebaseQuery(...params: TParams): UseQueryResult<TResult, Error> {
    const queryKey = getQueryKey(...params);
    
    // Use the re-exported useQuery hook
    return useQuery<TResult, Error>({
      queryKey,
      queryFn: () => {
        const result = queryFn(...params);
        // Update cache on successful query
        result.then(data => {
          if (data) {
            cacheService.set(queryKey.join('/'), data);
          }
        });
        return result;
      },
      staleTime,
      enabled,
    });
  };
}

// Re-export react-query hooks with our own types
export function useQuery<TData = unknown, TError = Error>(
  options: QueryObserverOptions<TData, TError, TData>
): UseQueryResult<TData, TError> {
  return useReactQuery<TData, TError>(options);
}

export const useMutation = useReactMutation;
export const useQueryClient = useReactQueryClient;
export const useInfiniteQuery = useReactInfiniteQuery;