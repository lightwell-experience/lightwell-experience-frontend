import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // We need to make sure that we compare-deep here as the default useEffect deps do not.
    if (!isEqual(value, debouncedValue)) {
      const timer = setTimeout(() => setDebouncedValue(value), delay !== undefined ? delay : 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
