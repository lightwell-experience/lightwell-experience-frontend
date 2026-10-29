import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import useDebounce from './useDebounce';

function usePageSafe(): boolean {
  const isFetching = !!useIsFetching();
  const isMutating = !!useIsMutating();
  const isSafe = !isFetching && !isMutating;

  const debouncedSafety = useDebounce(isSafe, 150);

  // if unsafe, we want to immediately return the value
  // if safe, we want to wait a small smount of time for cascading calls to occur
  return isSafe ? debouncedSafety : isSafe;
}

export default usePageSafe;
