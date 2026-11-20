import { mockVulnerabilities } from '../../mockVulnerabilities';
import { BEACON_WORKFLOW, type Status } from '../types';
import { getAddressedPackageIds, packageIdentity } from './addressedPackages';

const first = { ...mockVulnerabilities[0], status: 'Lightwell Network' as const };

it('includes packages only when every record is in Lightwell Network', () => {
  expect(getAddressedPackageIds([]).size).toBe(0);
  expect(getAddressedPackageIds([first, { ...first, uuid: 'second' }])).toEqual(
    new Set([packageIdentity(first)]),
  );
});

it.each<Status>([
  ...BEACON_WORKFLOW.statuses.filter((status) => status !== 'Lightwell Network'),
  BEACON_WORKFLOW.onHold,
  BEACON_WORKFLOW.unremediated,
])('excludes %s, including a conflicting duplicate record', (status) => {
  const other = { ...first, uuid: 'duplicate', status };
  expect(getAddressedPackageIds([other]).size).toBe(0);
  expect(getAddressedPackageIds([first, other]).size).toBe(0);
  expect(getAddressedPackageIds([other, first]).size).toBe(0);
});

it('keeps versions and ecosystems independent', () => {
  const otherVersion = { ...first, componentVersion: 'another', status: 'On Hold' as const };
  const otherEcosystem = { ...first, ecosystem: 'another', status: 'Unremediated' as const };
  expect(getAddressedPackageIds([first, otherVersion, otherEcosystem])).toEqual(
    new Set([packageIdentity(first)]),
  );
});
