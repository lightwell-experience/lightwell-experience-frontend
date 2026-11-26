import type { Vulnerability } from '../types';

export function packageIdentity(vulnerability: Vulnerability): string {
  return JSON.stringify([
    vulnerability.ecosystem,
    vulnerability.componentName,
    vulnerability.componentVersion,
  ]);
}

/** Check every record, including duplicates, before applying display filters. */
export function getAddressedPackageIds(vulnerabilities: Vulnerability[]): Set<string> {
  const eligible = new Set<string>();
  const excluded = new Set<string>();
  for (const vulnerability of vulnerabilities) {
    const id = packageIdentity(vulnerability);
    if (vulnerability.status === 'Lightwell Network') eligible.add(id);
    else excluded.add(id);
  }
  for (const id of excluded) eligible.delete(id);
  return eligible;
}
