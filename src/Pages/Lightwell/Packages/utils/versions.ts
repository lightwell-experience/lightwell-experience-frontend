import { RepositoryPackageItem, RepositoryPackageReleaseInfo } from 'services/Content/ContentApi';

/**
 * Removes the Lightwell release suffix (.rhlw-xxxx) from a version
 *
 * Example:
 * 1.2.3.rhlw-00001 -> 1.2.3
 */
export const stripLightwellVersionSuffix = (version: string): string =>
  version.replace(/(?:\.rhlw-|\+rhlw\.).*$/i, '');

export const pythonLightwellRelease = (version: string): string =>
  version.slice(stripLightwellVersionSuffix(version).length);

/**
 * Extracts a release number from a Lightwell version or release
 *
 * Examples:
 * 1.2.3.rhlw-0001 -> 1
 * rhlw-0002 -> 2
 */
export const lightwellReleaseNum = (versionOrRelease: string): number =>
  parseInt(versionOrRelease.match(/rhlw[-.](\d+)/i)?.[1] ?? '0', 10);

/**
 * Sorts versions in descending semantic order
 *
 * Example:
 * ['1.10.2', '1.9.2', '1.11.1'] -> ['1.11.1', '1.10.2', '1.9.2']
 */
export const sortVersionsDesc = (versions: string[]) =>
  [...versions].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }),
  );

/**
 * Compares two Lightwell versions in descending order, ignoring the .rhlw suffix
 *
 * Example:
 * 1.2.3.rhlw-0003 == 1.2.3.rhlw-0002
 * 2.3.4.rhlw-0001 > 2.3.3.rhlw-0002
 */
export const compareVersionsDesc = (a: string, b: string) =>
  stripLightwellVersionSuffix(b).localeCompare(stripLightwellVersionSuffix(a), undefined, {
    numeric: true,
    sensitivity: 'base',
  });

/**
 * Compares Lightwell releases in descending order. Orders initially by
 * version (ignoring the .rhlw suffix). If two releases have the same
 * version, uses the release number as a tiebreaker
 *
 * Example:
 * 1.2.3.rhlw-0001
 * 1.2.2.rhlw-0009
 * 1.2.2.rhlw-0008
 */
export const compareReleasesDesc = (
  a: RepositoryPackageItem['latest_releases'][number],
  b: RepositoryPackageItem['latest_releases'][number],
) => {
  const versionComparison = compareVersionsDesc(a.version, b.version);

  if (versionComparison !== 0) {
    return versionComparison;
  }

  return lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release);
};

// Formats a release { version, release } into a Lightwell release.
// Maven: { version: '5.3.18', release: 'rhlw-00007' } -> 5.3.18.rhlw-00007
// Python: { version: '1.2.3', release: 'rhlw.1' } -> 1.2.3+rhlw.1
export const toLightwellRelease = (
  release: Pick<RepositoryPackageReleaseInfo, 'version' | 'release'>,
) => {
  const { version, release: suffix } = release;
  if (!suffix || suffix.startsWith('+') || suffix.startsWith('.')) {
    return `${version}${suffix}`;
  }
  // Bare API suffixes: Python uses rhlw.N, Maven uses rhlw-NNNNN.
  const separator = /^rhlw\./i.test(suffix) ? '+' : '.';
  return `${version}${separator}${suffix}`;
};

export const getVersionSeries = (version: string): string => {
  const match = stripLightwellVersionSuffix(version).match(/^(\d+)\.(\d+)(?:\.|$)/);
  return match ? `${match[1]}.${match[2]}.X` : version;
};
