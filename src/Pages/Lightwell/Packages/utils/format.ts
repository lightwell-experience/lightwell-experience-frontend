import type { PackageCoordinate } from '../types';

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

/**
 * Formats an ISO date string as DD MMM YYYY
 *
 * Example:
 * 2024-03-14T00:00:00Z -> 14 Mar 2024
 */
export const formatReleaseDate = (iso?: string | null) => {
  if (!iso) return '—';

  const date = new Date(iso);

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Formats a package's display coordinate for its ecosystem
 *
 * Examples:
 * { name: 'json', group: 'org.json', ecosystem: 'maven' } -> org.json:json
 * { name: 'node', group: '@types', ecosystem: 'npm' }     -> @types/node
 * { name: 'requests', ecosystem: 'python' }               -> requests
 *
 * The switch is exhaustive on purpose: a new ecosystem must be handled here
 * rather than falling through to Maven.
 */
export const getPackageCoordinate = ({ name, group, ecosystem }: PackageCoordinate) => {
  switch (ecosystem) {
    case 'npm':
      // The packages endpoint sends '-' for unscoped packages.
      return group && group !== '-' ? `${group}/${name}` : name;
    case 'maven':
      return group ? `${group}:${name}` : name;
    case 'python':
      return name;
  }
};

/**
 * Formats package coordinates for clipboard copy
 *
 * Examples:
 * ({ name: 'json', group: 'org.json', ecosystem: 'maven' }, '1.2.3.rhlw-00001') -> org.json:json:1.2.3.rhlw-00001
 * ({ name: 'requests', ecosystem: 'python' }, '1.2.3') -> pip install requests==1.2.3
 * ({ name: 'node', group: '@types', ecosystem: 'npm' }, '1.0.0') -> npm install @types/node@1.0.0
 */
export const formatReleaseCopyText = (packageCoordinate: PackageCoordinate, version: string) => {
  switch (packageCoordinate.ecosystem) {
    case 'npm':
      return `npm install ${getPackageCoordinate(packageCoordinate)}@${version}`;
    case 'python':
      return `pip install ${packageCoordinate.name}==${version}`;
    case 'maven':
      return `${getPackageCoordinate(packageCoordinate)}:${version}`;
  }
};
