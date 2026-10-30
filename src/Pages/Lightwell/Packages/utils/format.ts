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

export const getPackageCoordinate = (packageCoordinate: PackageCoordinate) => {
  const isMaven = packageCoordinate.isMaven ?? !packageCoordinate.isPython;
  return isMaven && packageCoordinate.group
    ? `${packageCoordinate.group}:${packageCoordinate.name}`
    : packageCoordinate.name;
};

/**
 * Formats package coordinates for clipboard copy
 *
 * Examples:
 * ({ name: 'json', group: 'org.json', isMaven: true }, '1.2.3.rhlw-00001') -> org.json:json:1.2.3.rhlw-00001
 * ({ name: 'requests', isPython: true }, '1.2.3') -> pip install requests==1.2.3
 */
export const formatReleaseCopyText = (packageCoordinate: PackageCoordinate, version: string) => {
  const isPython = packageCoordinate.isPython ?? !packageCoordinate.isMaven;
  if (isPython) {
    return `pip install ${packageCoordinate.name}==${version}`;
  }

  return `${getPackageCoordinate(packageCoordinate)}:${version}`;
};
