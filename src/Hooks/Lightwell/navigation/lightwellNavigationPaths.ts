import {
  appendSearchParams,
  DEFAULT_PACKAGES_PARAMS,
  type LightwellPackagesParams,
} from '../lightwellPackagesParams';

export type LightwellDestinationKey = 'repositories' | 'repositoryPackages' | 'packageDetails';

export type LightwellNavigationParams = {
  rootPath: string;
  repoSlug?: string;
  packageName?: string;
  groupId?: string;
  packagesParams?: LightwellPackagesParams;
};

type BuildLightwellPath = (params: LightwellNavigationParams) => string;

/**
 * Builds location strings for Lightwell routes from navigation parameters
 *
 * Routes use repository slugs (e.g. java-validated)
 * Maven package details include groupId in the path; Python packages do not
 *
 * To add a new destination:
 * 1. Add a key to LightwellDestinationKey
 * 2. Add a builder for that key below in lightwellNavigationPaths
 * 3. Extend LightwellNavigationParams if different params are needed
 * 4. Call it from page components via useLightwellNavigateTo().navigateTo
 */
export const lightwellNavigationPaths: Record<LightwellDestinationKey, BuildLightwellPath> = {
  repositories: ({ rootPath }) => rootPath,
  repositoryPackages: ({ rootPath, repoSlug, packagesParams }) =>
    appendSearchParams(`${rootPath}/${repoSlug}`, packagesParams ?? DEFAULT_PACKAGES_PARAMS),
  packageDetails: ({ rootPath, repoSlug, packageName, groupId, packagesParams }) => {
    const path = groupId
      ? `${rootPath}/${repoSlug}/${encodeURIComponent(groupId)}/${encodeURIComponent(packageName!)}`
      : `${rootPath}/${repoSlug}/${encodeURIComponent(packageName!)}`;

    return appendSearchParams(path, packagesParams ?? DEFAULT_PACKAGES_PARAMS);
  },
};

export const lensNavigationPaths = {
  lens: (rootPath: string) => `${rootPath}/lens`,
  lensReport: (rootPath: string, reportUUID: string) =>
    `${rootPath}/lens/${encodeURIComponent(reportUUID)}`,
};
