import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router-dom';

import {
  lensNavigationPaths,
  lightwellNavigationPaths,
  type LightwellDestinationKey,
  type LightwellNavigationParams,
} from './lightwellNavigationPaths';
import { useLightwellRootPath } from './useLightwellRootPath';

type NavigateArgs = Omit<LightwellNavigationParams, 'rootPath'>;

/**
 * Navigates to destinations using paths from lightwellNavigationPaths
 *
 * Add new destinations in lightwellNavigationPaths.ts
 */
export const useLightwellNavigateTo = () => {
  const navigate = useNavigate();
  const rootPath = useLightwellRootPath();

  const navigateTo = useCallback(
    (destination: LightwellDestinationKey, params: NavigateArgs = {}) => {
      navigate(lightwellNavigationPaths[destination]({ rootPath, ...params }));
    },
    [navigate, rootPath],
  );

  const navigateToLens = useCallback(() => {
    navigate(lensNavigationPaths.lens(rootPath));
  }, [navigate, rootPath]);

  const navigateToLensReport = useCallback(
    (reportUUID: string, options?: NavigateOptions) => {
      const path = lensNavigationPaths.lensReport(rootPath, reportUUID);
      if (options !== undefined) {
        navigate(path, options);
      } else {
        navigate(path);
      }
    },
    [navigate, rootPath],
  );

  return { navigateTo, navigateToLens, navigateToLensReport };
};
