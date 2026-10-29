import { Button, Flex, Label, SearchInput } from '@patternfly/react-core';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import LightwellEmptyState from '../../components/LightwellEmptyState';
import { useAdvisoryDrawerParams } from '../hooks/useAdvisoryDrawerParams';
import type { PackageAdvisoryRemediation } from '../types';
import AdvisoryFilterDropdown from '../components/AdvisoryFilterDropdown';
import CopyLabel from '../components/CopyLabel';
import PackageVersionTitle from '../components/PackageVersionTitle';
import { ADVISORY_SEVERITIES, SEVERITY_LABEL_COLORS } from '../utils/severity';
import { sortVersionsDesc } from '../utils/versions';

type PackageRemediationsTabProps = {
  name: string;
  version: string;
  remediations: PackageAdvisoryRemediation[];
  isLoading: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  formatCopyText: (version: string) => string;
};

const PackageRemediationsTab = ({
  name,
  version,
  remediations,
  isLoading,
  isFetching,
  isPlaceholderData,
  formatCopyText,
}: PackageRemediationsTabProps) => {
  const [search, setSearch] = useState('');
  const [releaseFilter, setReleaseFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const { getAdvisorySearch, replaceAdvisoryLink } = useAdvisoryDrawerParams();

  const releaseOptions = useMemo(
    () => sortVersionsDesc([...new Set(remediations.map((row) => row.lightwellRelease))]),
    [remediations],
  );

  const searchTerm = search.trim().toLowerCase();

  const filteredRemediations = remediations.filter((row) => {
    const matchesSearch =
      row.advisoryName.toLowerCase().includes(searchTerm) ||
      row.lightwellRelease.toLowerCase().includes(searchTerm);
    return (
      matchesSearch &&
      (!releaseFilter || row.lightwellRelease === releaseFilter) &&
      (!severityFilter || row.severity === severityFilter)
    );
  });

  const isTableLoading = isLoading || isPlaceholderData;
  const areFiltersDisabled = isTableLoading || remediations.length === 0;

  const hasNoMatchingRemediations =
    !isTableLoading && remediations.length > 0 && filteredRemediations.length === 0;

  const hasEmptyTableState =
    !isTableLoading && (remediations.length === 0 || hasNoMatchingRemediations);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <PackageVersionTitle name={name} version={version} descriptor='Remediations' />
      <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
        <SearchInput
          aria-label='Search CVEs or releases'
          placeholder='Search CVEs or releases'
          style={{ width: '222px' }}
          value={search}
          onChange={(_event, value) => setSearch(value)}
          onClear={() => setSearch('')}
          isDisabled={areFiltersDisabled}
        />
        <AdvisoryFilterDropdown
          label='Release'
          value={releaseFilter}
          options={[
            { value: '', label: 'All' },
            ...releaseOptions.map((release) => ({ value: release, label: release })),
          ]}
          onChange={setReleaseFilter}
          isDisabled={areFiltersDisabled}
        />
        <AdvisoryFilterDropdown
          label='Severity'
          value={severityFilter}
          options={[
            { value: '', label: 'All' },
            ...ADVISORY_SEVERITIES.map((severity) => ({ value: severity, label: severity })),
          ]}
          onChange={setSeverityFilter}
          isDisabled={areFiltersDisabled}
        />
      </Flex>
      <Table
        aria-label={`Remediations for: ${name} ${version}`}
        aria-busy={isFetching || isTableLoading}
        isStriped={!hasEmptyTableState}
        borders={!hasEmptyTableState}
      >
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th width={30} className='pf-v6-u-text-align-end'>
              Available in
            </Th>
          </Tr>
        </Thead>
        {isTableLoading ? (
          <SkeletonTableBody rowsCount={5} columnsCount={2} />
        ) : remediations.length === 0 ? (
          <Tbody>
            <Tr>
              <Td colSpan={2}>
                <LightwellEmptyState
                  variant='empty'
                  displayedItemsName='remediations'
                  bodyText='No remediations are available for this package version.'
                />
              </Td>
            </Tr>
          </Tbody>
        ) : hasNoMatchingRemediations ? (
          <Tbody>
            <Tr>
              <Td colSpan={2}>
                <LightwellEmptyState
                  variant='noMatch'
                  displayedItemsName='remediations'
                  callToAction={{
                    label: 'Clear filters',
                    onClick: () => {
                      setSearch('');
                      setReleaseFilter('');
                      setSeverityFilter('');
                    },
                  }}
                />
              </Td>
            </Tr>
          </Tbody>
        ) : (
          <Tbody>
            {filteredRemediations.map((build) => (
              <Tr key={`${build.advisoryName}-${build.lightwellRelease}`}>
                <Td dataLabel='Name'>
                  <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <Button
                      variant='link'
                      isInline
                      component={(props) => (
                        <Link
                          {...props}
                          to={getAdvisorySearch(build.advisoryName)}
                          replace={replaceAdvisoryLink}
                        />
                      )}
                    >
                      {build.advisoryName}
                    </Button>
                    <Label
                      isCompact
                      variant='outline'
                      color={SEVERITY_LABEL_COLORS[build.severity]}
                    >
                      {build.severity}
                    </Label>
                  </Flex>
                </Td>
                <Td dataLabel='Available in'>
                  <Flex
                    gap={{ default: 'gapSm' }}
                    alignItems={{ default: 'alignItemsCenter' }}
                    justifyContent={{ default: 'justifyContentFlexEnd' }}
                  >
                    {build.isLatest ? (
                      <Label isCompact color='blue'>
                        Latest
                      </Label>
                    ) : null}
                    <CopyLabel copyText={formatCopyText(build.lightwellRelease)}>
                      {build.lightwellRelease}
                    </CopyLabel>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        )}
      </Table>
    </Flex>
  );
};

export default PackageRemediationsTab;
