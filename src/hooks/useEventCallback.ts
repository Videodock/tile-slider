import { useRef } from 'react';

export const useEventCallback = <T extends (...args: any[]) => unknown>(fn: T) => {
  const handler = useRef(fn);
  handler.current = fn;

  return handler.current;
};
