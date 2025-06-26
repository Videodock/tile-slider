import { useCallback, useInsertionEffect, useRef } from 'react';

// biome-ignore lint/suspicious/noExplicitAny: we don't know the arguments ¯\_(ツ)_/¯
export const useEventCallback = <T extends (...args: any[]) => unknown>(fn: T) => {
  const handler = useRef(fn);

  useInsertionEffect(() => {
    handler.current = fn;
  }, [fn]);

  // biome-ignore lint/suspicious/noExplicitAny: we don't know the arguments ¯\_(ツ)_/¯
  return useCallback((...args: any[]) => {
    return handler.current(...args);
  }, []) as T;
};
