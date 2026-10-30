import { Button, Flex, Label, Title } from '@patternfly/react-core';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useMemo } from 'react';

import { RepositoryPackageReleaseInfo } from '../../../../services/Content/ContentApi';
import { formatReleaseDate } from '../utils/format';

type PackageVersionsTabProps = {
  currentVersion: string;
  versions: string[];
  latestReleases: RepositoryPackageReleaseInfo[];
  onVersionSelect: (version: string) => void;
};

const PackageVersionsTab = ({
  currentVersion,
  versions,
  latestReleases,
  onVersionSelect,
}: PackageVersionsTabProps) => {
  const releaseDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    latestReleases.forEach((r) => {
      map[r.version] = formatReleaseDate(r.created_at);
    });
    return map;
  }, [latestReleases]);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <Title headingLevel='h2' size='lg'>
        Available versions
      </Title>
      <Table aria-label='Available versions' variant={TableVariant.compact}>
        <Thead>
          <Tr>
            <Th>Version</Th>
            <Th width={15}>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {versions.map((version) => {
            const isSelected = version === currentVersion;
            return (
              <Tr key={version}>
                <Td dataLabel='Version'>
                  {isSelected ? (
                    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <span style={{ fontWeight: 'bold' }}>{version}</span>
                      <Label isCompact color='blue'>
                        Selected
                      </Label>
                    </Flex>
                  ) : (
                    <Button variant='link' isInline onClick={() => onVersionSelect(version)}>
                      {version}
                    </Button>
                  )}
                </Td>
                <Td dataLabel='Date'>{releaseDateMap[version] ?? '—'}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Flex>
  );
};

export default PackageVersionsTab;
