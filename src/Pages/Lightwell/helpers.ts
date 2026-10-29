import { createElement, type ReactElement } from 'react';
import { CodeIcon, JavaIcon, PythonIcon } from '@patternfly/react-icons';
import { capitalize } from 'lodash';
import {
  CONTENT_TYPE_PARAMETERS,
  LIGHTWELL_ORIGIN,
  PACKAGE_DESCRIPTIONS,
  REPOSITORY_DESCRIPTIONS,
} from './constants';

const getContentTypeParameters = (contentType?: string) => {
  const normalized = contentType?.toLowerCase();
  if (!normalized || !Object.keys(CONTENT_TYPE_PARAMETERS).includes(normalized)) return undefined;
  return CONTENT_TYPE_PARAMETERS[normalized];
};

export const getEcosystemFromContentType = (contentType?: string): string | undefined =>
  getContentTypeParameters(contentType)?.ecosystem;

export const getEcosystemIcon = (ecosystemOrContentType?: string): ReactElement => {
  switch (ecosystemOrContentType?.toLowerCase()) {
    case 'java':
    case 'maven':
      return createElement(JavaIcon);
    case 'python':
      return createElement(PythonIcon);
    default:
      return createElement(CodeIcon);
  }
};

// Repositories whose packages carry Red Hat backported fixes in pinned versions.
// Both remediated and predisclosure repos ship these fixes, so they share the same
// package/release handling (version-suffix stripping, release derivation, fix tabs).
export const hasBackportedFixes = (securityLevel?: string): boolean => {
  const level = securityLevel?.toLowerCase();
  return level === 'remediated' || level === 'predisclosure';
};

export const getRepositoryDescription = (
  contentType?: string,
  securityLevel?: string,
): string | undefined => {
  const normalizedType = contentType?.toLowerCase();
  const normalizedLevel = securityLevel?.toLowerCase();
  if (!normalizedType || !normalizedLevel) return undefined;
  return REPOSITORY_DESCRIPTIONS[normalizedType]?.[normalizedLevel];
};

// Returns the long-form "About this package" description for a package, based on the
// security level and content type of the repository it belongs to.
export const getPackageByRepositoryDescription = (
  securityLevel?: string,
  contentType?: string,
): string | undefined => {
  const normalizedType = contentType?.toLowerCase();
  const normalizedLevel = securityLevel?.toLowerCase();
  if (!normalizedType || !normalizedLevel) return undefined;
  return PACKAGE_DESCRIPTIONS[normalizedType]?.[normalizedLevel];
};

export const formatRepositoryName = (
  contentType?: string,
  securityLevel?: string,
  fallbackName?: string,
) => {
  const ecosystem = getEcosystemFromContentType(contentType);

  if (ecosystem && securityLevel) {
    return `${capitalize(ecosystem)} ${capitalize(securityLevel)}`;
  }

  return fallbackName || '—';
};

// Creates readable path slug from repository's ecosystem and security level
export const getRepositoryPathSlug = (contentType?: string, securityLevel?: string): string => {
  const ecosystem = getEcosystemFromContentType(contentType)?.toLowerCase();
  const level = securityLevel?.toLowerCase();

  if (!ecosystem || !level) {
    return '';
  }

  return `${ecosystem}-${level}`;
};

export const getSlugFromRepositoryName = (name: string): string => {
  const path = name.replace(`${LIGHTWELL_ORIGIN}/`, '').replace('/', '-');
  return path || '';
};

// Converts URL path slug to its Lightwell repository name
export const getRepositoryNameFromPathSlug = (slug: string): string => {
  const normalized = slug.toLowerCase();
  const separatorIndex = normalized.indexOf('-');

  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return '';
  }

  const ecosystem = normalized.slice(0, separatorIndex);
  const securityLevel = normalized.slice(separatorIndex + 1);

  return `${LIGHTWELL_ORIGIN}/${ecosystem}/${securityLevel}`;
};

/**
 * Transforms published distribution URL by replacing /api/pulp-content/lightwell with /lightwell
 * When a pulp path is rewritten, the result is normalized to end with /.
 * URLs without a pulp path are returned unchanged.
 *
 * Example:
 * https://packages.redhat.com/api/pulp-content/lightwell/java/validated
 * -> https://packages.redhat.com/lightwell/java/validated/
 * https://packages.redhat.com/api/pulp-content/public-lightwell-demo/python/validated/simple
 * -> https://packages.redhat.com/lightwell/public-lightwell-demo/python/validated/simple/
 */
export const formatDistributionUrl = (url: string): string => {
  if (!url) return '';
  const transformed = url
    .replace('/api/pulp-content/public-lightwell-demo', '/lightwell/public-lightwell-demo')
    .replace('/api/pulp-content/lightwell', '/lightwell');
  if (transformed === url) {
    return url;
  }
  return transformed.endsWith('/') ? transformed : `${transformed}/`;
};

const stripPythonSimpleSuffix = (url: string): string =>
  formatDistributionUrl(url)
    .replace(/\/+$/, '')
    .replace(/\/simple$/, '');

/**
 * Python index URL for pip / pipenv / poetry / requirements / pip.conf (.../simple).
 * Call only for python repositories (the caller decides via content_type).
 */
export const formatPythonIndexUrl = (url: string): string =>
  `${stripPythonSimpleSuffix(url)}/simple`;

/**
 * Python display URL for the packages table header (.../simple/).
 * Call only for python repositories (the caller decides via content_type).
 */
export const formatPythonDisplayUrl = (url: string): string =>
  `${stripPythonSimpleSuffix(url)}/simple/`;
