import { Flex, Label } from '@patternfly/react-core';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useMemo } from 'react';

import { RepositoryPackageReleaseInfo } from '../../../../services/Content/ContentApi';
import CopyLabel from '../components/CopyLabel';
import LightwellEmptyState from '../../components/LightwellEmptyState';
import PackageVersionTitle from '../components/PackageVersionTitle';
import type { PackageCoordinate } from '../types';
import { formatReleaseCopyText, formatReleaseDate } from '../utils/format';
import { lightwellReleaseNum, toLightwellRelease } from '../utils/versions';

type PackageReleasesTabProps = {
  version: string;
  builds: RepositoryPackageReleaseInfo[];
  packageCoordinate: PackageCoordinate;
  isLoading?: boolean;
};

const PackageReleasesTab = ({
  version,
  builds,
  packageCoordinate,
  isLoading = false,
}: PackageReleasesTabProps) => {
  const releases = useMemo(
    () =>
      [...builds]
        .filter((build) => !!build.release)
        .sort((a, b) => lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release)),
    [builds],
  );

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <PackageVersionTitle name={packageCoordinate.name} version={version} descriptor='Releases' />
      <Table aria-label={`Releases for ${version}`} aria-busy={isLoading} isStriped>
        <Thead>
          <Tr>
            <Th>Release</Th>
            <Th width={15}>Date released</Th>
          </Tr>
        </Thead>
        {isLoading ? (
          <SkeletonTableBody rowsCount={5} columnsCount={2} />
        ) : releases.length === 0 ? (
          <Tbody>
            <Tr>
              <Td colSpan={2}>
                <LightwellEmptyState
                  variant='empty'
                  titleText='No releases for this version'
                  bodyText='Lightwell has not published a release for this version yet. Select a different version to see its releases.'
                />
              </Td>
            </Tr>
          </Tbody>
        ) : (
          <Tbody>
            {releases.map((build, index) => {
              const release = toLightwellRelease(build);

              return (
                <Tr key={release}>
                  <Td dataLabel='Release'>
                    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <CopyLabel copyText={formatReleaseCopyText(packageCoordinate, release)}>
                        {release}
                      </CopyLabel>
                      {index === 0 ? (
                        <Label isCompact color='blue'>
                          Latest
                        </Label>
                      ) : null}
                    </Flex>
                  </Td>
                  <Td dataLabel='Date released'>{formatReleaseDate(build.created_at)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        )}
      </Table>
    </Flex>
  );
};

export default PackageReleasesTab;
