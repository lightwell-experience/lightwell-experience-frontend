import { useEffect, useMemo, useRef, useState } from 'react';
import { ChromeAPI } from '@redhat-cloud-services/types';
import getRBAC from '@redhat-cloud-services/frontend-components-utilities/RBAC';
import {
  useSelfAccessCheck,
  fetchDefaultWorkspace,
  type SelfAccessCheckResultItemWithRelation,
  type SelfAccessCheckResourceWithRelation,
} from '@project-kessel/react-kessel-access-check';
import { Features } from 'services/Features/FeatureApi';
import { RbacPermissions } from './rbacPermissions';
import PackageJson from '../../package.json';
import { BulkSelfAccessCheckNestedRelationsParams } from '@project-kessel/react-kessel-access-check/types';

const { appname } = PackageJson.insights;

export const KESSEL_REPOSITORY_VIEW = 'content_sources_repository_view';
export const KESSEL_REPOSITORY_EDIT = 'content_sources_repository_edit';
export const KESSEL_TEMPLATE_VIEW = 'content_sources_template_view';
export const KESSEL_TEMPLATE_EDIT = 'content_sources_template_edit';

/**
 * Maps Kessel access check results to RBAC permission structure.
 * Extracts repository and template permissions from Kessel response.
 */
export const mapKesselToRbac = (
  kesselData: SelfAccessCheckResultItemWithRelation[] | undefined,
): Record<keyof typeof RbacPermissions, boolean> | undefined => {
  if (!kesselData || kesselData.length == 0) return undefined;

  return {
    repoRead: kesselData.find((d) => d.relation === KESSEL_REPOSITORY_VIEW)?.allowed ?? false,
    repoWrite: kesselData.find((d) => d.relation === KESSEL_REPOSITORY_EDIT)?.allowed ?? false,
    templateRead: kesselData.find((d) => d.relation === KESSEL_TEMPLATE_VIEW)?.allowed ?? false,
    templateWrite: kesselData.find((d) => d.relation === KESSEL_TEMPLATE_EDIT)?.allowed ?? false,
  };
};

/**
 * Hook to fetch default workspace
 */
export const useKesselWorkspace = (enabled: boolean) => {
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const didResolveRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      didResolveRef.current = false;
      return;
    }

    if (didResolveRef.current) {
      return;
    }

    didResolveRef.current = true;

    let cancelled = false;
    const baseUrl = window.location.origin;

    fetchDefaultWorkspace(baseUrl)
      .then((ws) => {
        if (!cancelled) {
          setWorkspaceId(ws.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspaceId(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { workspaceId, loading };
};

/**
 * Hook to fetch the rbac permissions from Kessel
 */
export const useKesselRbac = (workspaceId: string | undefined, workspaceLoading: boolean) => {
  const params = useMemo(() => {
    // Don't make a request if we don't have a workspace ID yet
    if (!workspaceId) {
      return { resources: [] };
    }

    const resources: SelfAccessCheckResourceWithRelation[] = [
      {
        id: workspaceId,
        type: 'workspace',
        relation: KESSEL_REPOSITORY_VIEW,
        reporter: { type: 'rbac' },
      },
      {
        id: workspaceId,
        type: 'workspace',
        relation: KESSEL_REPOSITORY_EDIT,
        reporter: { type: 'rbac' },
      },
      {
        id: workspaceId,
        type: 'workspace',
        relation: KESSEL_TEMPLATE_VIEW,
        reporter: { type: 'rbac' },
      },
      {
        id: workspaceId,
        type: 'workspace',
        relation: KESSEL_TEMPLATE_EDIT,
        reporter: { type: 'rbac' },
      },
    ];

    return {
      resources: resources as BulkSelfAccessCheckNestedRelationsParams['resources'],
    };
  }, [workspaceId]);

  const { data: kesselData, loading: kesselLoading } = useSelfAccessCheck(
    params as BulkSelfAccessCheckNestedRelationsParams,
  );
  const rbac = mapKesselToRbac(kesselData);
  const loading = workspaceLoading || kesselLoading || !rbac;
  return { rbac, loading };
};

/**
 * Hook to fetch permissions from RBAC v1
 */
export const useTraditionalRbac = (
  chrome: ChromeAPI | undefined,
  features: Features | null,
  enabled: boolean,
) => {
  const [rbac, setRbac] = useState<Record<keyof typeof RbacPermissions, boolean> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (chrome && features !== null && enabled && !rbac) {
      chrome.auth.getUser().then(async () =>
        getRBAC(appname).then((res) => {
          const rbacSet = new Set(res.permissions.map(({ permission }) => permission));

          setRbac({
            repoRead: rbacSet.has('content-sources:repositories:read'),
            repoWrite: rbacSet.has('content-sources:repositories:write'),
            templateRead: rbacSet.has('content-sources:templates:read'),
            templateWrite: rbacSet.has('content-sources:templates:write'),
          });
        }),
      );
    }
  }, [!!chrome, features, enabled, rbac]);

  return { rbac, loading: !rbac };
};
