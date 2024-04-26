import { useCallback, useRef, useInsertionEffect } from 'react';

export const useEventCallback = <T extends (...args: any[]) => unknown>(fn: T) => {
  const handler = useRef(fn);

  useInsertionEffect(() => {
    handler.current = fn;
  }, [fn])

  return useCallback((...args: any[]) => {
    return handler.current(...args);
  }, []) as T;
};
