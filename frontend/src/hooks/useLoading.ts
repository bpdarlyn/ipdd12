import { useState, useCallback, useRef, useEffect } from 'react';
import * as React from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface UseLoadingOptions {
  initialLoading?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const { initialLoading = false, onSuccess, onError } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    data: null,
  });

  const isMountedRef = useRef(true);

  const setLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isLoading: loading }));
    }
  }, []);

  const setError = useCallback((error: string | null) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, error, isLoading: false }));
    }
  }, []);

  const setData = useCallback((data: any) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, data, error: null, isLoading: false }));
    }
  }, []);

  const execute = useCallback(async (asyncFunction: () => Promise<any>) => {
    try {
      setLoading(true);
      setState(prev => ({ ...prev, error: null }));
      
      const result = await asyncFunction();
      
      if (isMountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'An error occurred';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        onError?.(error);
      }
      
      throw error;
    }
  }, [setLoading, setData, setError, onSuccess, onError]);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({
        isLoading: false,
        error: null,
        data: null,
      });
    }
  }, []);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    execute,
    reset,
    cleanup,
  };
};

// Hook for managing multiple loading states
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({
        ...prev,
        [key]: false,
      }));
    } else {
      setLoadingStates({});
    }
  }, []);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    reset,
  };
};

// Hook for handling async operations with automatic loading states
export const useAsync = <T = any>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) => {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: true,
  });

  const execute = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await asyncFunction();
      setState({ data: result, error: null, isLoading: false });
      return result;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'An error occurred';
      setState({ data: null, error: errorMessage, isLoading: false });
      throw error;
    }
  }, dependencies);

  // Execute on mount and when dependencies change
  React.useEffect(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
    retry: execute,
  };
};

export default useLoading;