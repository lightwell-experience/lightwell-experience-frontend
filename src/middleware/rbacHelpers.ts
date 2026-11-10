import { useEffect, useMemo, useRef, useState } from 'react';
import { ChromeAPI } from '@redhat-cloud-services/types';
import getRBAC from '@redhat-cloud-services/frontend-components-utilities/RBAC';
import {
  useSelfAccessCheck,
  fetchDefaultWorkspace,
  type SelfAccessCheckResultItemWithRelation,
  type SelfAccessCheckResourceWithRelation,
} from '@project-kessel/react-kessel-access-check';
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
  const [error, setError] = useState(false);
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
      .catch((err: unknown) => {
        console.error('Failed to fetch default Kessel workspace', err);
        if (!cancelled) {
          setWorkspaceId(undefined);
          setError(true);
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

  return { workspaceId, loading, error };
};

/**
 * Hook to fetch the rbac permissions from Kessel
 */
export const useKesselRbac = (
  workspaceId: string | undefined,
  workspaceLoading: boolean,
  workspaceError: boolean,
) => {
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

  const {
    data: kesselData,
    loading: kesselLoading,
    error: kesselError,
  } = useSelfAccessCheck(params as BulkSelfAccessCheckNestedRelationsParams);

  useEffect(() => {
    if (kesselError) {
      console.error('Kessel self access check failed', kesselError);
    }
  }, [kesselError]);

  // A failed workspace lookup produces an empty resources array, which resolves
  // the bulk check immediately with no data — indistinguishable from "no
  // permissions" unless we track the workspace failure separately. Treat either
  // failure as an error rather than silently waiting on a `rbac` that will
  // never arrive.
  const error = workspaceError || !!kesselError;
  const rbac = error ? undefined : mapKesselToRbac(kesselData);
  const loading = workspaceLoading || kesselLoading || (!rbac && !error);
  return { rbac, loading, error };
};

/**
 * Hook to fetch permissions from RBAC v1
 */
export const useTraditionalRbac = (
  chrome: ChromeAPI | undefined,
  isFeaturesSettled: boolean,
  enabled: boolean,
) => {
  const [rbac, setRbac] = useState<Record<keyof typeof RbacPermissions, boolean> | undefined>(
    undefined,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    // Wait for the features fetch to *settle* (succeed or fail), not to succeed —
    // RBAC v1 permissions don't depend on `features`, so a failed features call
    // (e.g. the user lacks a role features-gates on) must not block this check.
    if (chrome && isFeaturesSettled && enabled && !rbac && !error) {
      chrome.auth
        .getUser()
        .then(async () =>
          getRBAC(appname).then((res) => {
            const rbacSet = new Set(res.permissions.map(({ permission }) => permission));

            setRbac({
              repoRead: rbacSet.has('content-sources:repositories:read'),
              repoWrite: rbacSet.has('content-sources:repositories:write'),
              templateRead: rbacSet.has('content-sources:templates:read'),
              templateWrite: rbacSet.has('content-sources:templates:write'),
            });
          }),
        )
        .catch((err: unknown) => {
          console.error('Failed to fetch RBAC v1 permissions', err);
          setError(true);
        });
    }
  }, [!!chrome, isFeaturesSettled, enabled, rbac, error]);

  return { rbac, loading: !rbac && !error, error };
};
