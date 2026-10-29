import { useMemo } from 'react';
import { useHref } from 'react-router-dom';

import { LIGHTWELL_ROUTE } from '../../../Pages/Lightwell/constants';
import { useLightwellDemo } from 'Pages/Lightwell/LightwellDemoContext';

// Resolves the Lightwell root path from the current route context
export function useLightwellRootPath(): string {
  const path = useHref(LIGHTWELL_ROUTE);
  const isDemo = useLightwellDemo();

  return useMemo(() => {
    const root = path.replace(/\/$/, '') || LIGHTWELL_ROUTE;
    return isDemo ? `${root}/demo` : root;
  }, [path, isDemo]);
}
