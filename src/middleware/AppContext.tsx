import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Features } from 'services/Features/FeatureApi';
import { useFetchFeaturesQuery } from 'services/Features/FeatureQueries';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { useKesselWorkspace, useKesselRbac, useTraditionalRbac } from './rbacHelpers';
import { RbacPermissions } from './rbacPermissions';

// Keep existing `import { RbacPermissions } from 'middleware/AppContext'` working.
export { RbacPermissions };

export interface AppContextInterface {
  rbac?: Record<keyof typeof RbacPermissions, boolean>;
  features: Features | null;
  isFetchingPermissions: boolean;
  chrome?: ChromeAPI;
}

export const AppContext = createContext({} as AppContextInterface);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [features, setFeatures] = useState<Features | null>(null);

  const chrome = useChrome();
  const { fetchFeatures, isLoading: isFetchingFeatures } = useFetchFeaturesQuery();

  const useKessel = !!(features?.kessel?.enabled && features.kessel?.accessible);

  const { workspaceId, loading: workspaceLoading } = useKesselWorkspace(useKessel);
  const kesselPermissions = useKesselRbac(workspaceId, workspaceLoading);
  const traditionalPermissions = useTraditionalRbac(chrome, features, !useKessel);

  const rbac = useKessel ? kesselPermissions.rbac : traditionalPermissions.rbac;
  const rbacLoading = useKessel ? kesselPermissions.loading : traditionalPermissions.loading;

  useEffect(() => {
    (async () => {
      setFeatures(await fetchFeatures());
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{
        rbac,
        features,
        isFetchingPermissions: isFetchingFeatures || rbacLoading,
        chrome: chrome as ChromeAPI,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
