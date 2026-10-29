import { Flex, FlexItem, Icon, Label, SearchInput, Title } from '@patternfly/react-core';
import { RhUiArrowRightIcon } from '@patternfly/react-icons';
import { ExpandableRowContent, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { createUseStyles } from 'react-jss';

import LightwellEmptyState from '../../components/LightwellEmptyState';
import { getEcosystemIcon } from '../../helpers';
import type { AdvisoryRemediationEcosystem } from '../types';
import AdvisoryFilterDropdown from '../components/AdvisoryFilterDropdown';
import CopyLabel from '../components/CopyLabel';
import RemediationExportButton from '../components/RemediationExportButton';
import { useAdvisoryRemediationsTable } from '../hooks/useAdvisoryRemediationsTable';
import { pluralize } from '../utils/format';
import sizing from '@patternfly/react-styles/css/utilities/Sizing/sizing';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

type AdvisoryRemediationsTabProps = {
  advisoryName: string;
  remediations: AdvisoryRemediationEcosystem[];
};

const useStyles = createUseStyles({
  expandableTable: {
    '--pf-v6-c-table--compound-expansion--m-expanded--BackgroundColor': 'transparent',
    '--pf-v6-c-table__tr--m-clickable--hover--BackgroundColor': 'transparent',
    '& > tbody > tr > td > .pf-v6-c-table__expandable-row-content': { padding: 0 },
    '& > tbody > tr > td.pf-v6-c-table__toggle': {
      padding: '4px 4px',
      width: 32,
    },
    '& > tbody > tr > td.pf-v6-c-table__toggle > button': {
      '--pf-v6-c-button--m-plain--hover--BackgroundColor': 'transparent',
      '--pf-v6-c-button--m-plain--m-clicked--BackgroundColor': 'transparent',
      minWidth: 24,
      minHeight: 24,
      padding: 0,
    },
    '& > tbody > tr > td:not(.pf-v6-c-table__toggle):not(.pf-m-no-padding)': {
      padding: '4px 0',
    },
  },
  packageTable: { width: 'calc(100% - 12px)' },
  seriesTable: { width: 'calc(100% - 24px)' },
  table: {
    maxWidth: 'calc(100% - 20px)',
    '& > thead > tr > th': {
      '--pf-v6-c-table--cell--MaxWidth': 'none',
      '--pf-v6-c-table--cell--Overflow': 'visible',
      '--pf-v6-c-table--cell--TextOverflow': 'clip',
      '--pf-v6-c-table--cell--WhiteSpace': 'nowrap',
    },
  },
});

const AdvisoryRemediationsTab = ({ advisoryName, remediations }: AdvisoryRemediationsTabProps) => {
  const classes = useStyles();

  const {
    search,
    setSearch,
    ecosystemFilter,
    setEcosystemFilter,
    visibleRemediations,
    isRowExpanded,
    toggleRow,
    clearFilters,
  } = useAdvisoryRemediationsTable(remediations);

  let nextRowIndex = 0;

  return (
    <div className={spacing.ptLg}>
      <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
        <SearchInput
          aria-label='Search packages or versions'
          placeholder='Search packages or versions'
          style={{ width: '246px' }}
          value={search}
          onChange={(_event, value) => setSearch(value)}
          onClear={() => setSearch('')}
          isDisabled={remediations.length === 0}
        />
        <AdvisoryFilterDropdown
          label='Ecosystem'
          value={ecosystemFilter}
          options={[
            { value: '', label: 'All' },
            ...remediations.map((ecosystem) => ({
              value: ecosystem.name,
              label: ecosystem.name,
            })),
          ]}
          onChange={setEcosystemFilter}
          isDisabled={remediations.length === 0}
        />
        <RemediationExportButton advisoryName={advisoryName} remediations={remediations} />
      </Flex>

      {remediations.length === 0 ? (
        <LightwellEmptyState variant='empty' displayedItemsName='remediations' />
      ) : visibleRemediations.length ? (
        visibleRemediations.map((ecosystem) => (
          <div key={ecosystem.name} className={spacing.mtLg}>
            <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Icon size='xl'>{getEcosystemIcon(ecosystem.name)}</Icon>
              </FlexItem>
              <FlexItem>
                <Title headingLevel='h3' size='xl'>
                  {ecosystem.name}
                </Title>
              </FlexItem>
            </Flex>

            <Table
              aria-label={`${ecosystem.name} remediation packages`}
              variant='compact'
              gridBreakPoint=''
              borders={false}
              isPlain
              isExpandable
              className={[
                classes.expandableTable,
                classes.packageTable,
                spacing.mtSm,
                spacing.mlMd,
              ].join(' ')}
            >
              {ecosystem.packages.map((pkg) => {
                const packageKey = JSON.stringify(['package', ecosystem.name, pkg.name]);
                const packageExpanded = isRowExpanded(packageKey);
                const packageRowIndex = nextRowIndex++;

                return (
                  <Tbody key={packageKey} isExpanded={packageExpanded}>
                    <Tr
                      isControlRow
                      isContentExpanded={packageExpanded}
                      isClickable
                      onRowClick={() => toggleRow(packageKey)}
                    >
                      <Td
                        expand={{
                          rowIndex: packageRowIndex,
                          isExpanded: packageExpanded,
                          expandId: 'advisory-expand-',
                          onToggle: (event) => {
                            event.stopPropagation();
                            toggleRow(packageKey);
                          },
                        }}
                      />
                      <Td dataLabel='Package'>
                        <Flex
                          id={`simple-node${packageRowIndex}`}
                          className={sizing.minWidth}
                          direction={{ default: 'column' }}
                          alignItems={{ default: 'alignItemsFlexStart' }}
                          gap={{ default: 'gapSm' }}
                        >
                          <strong>{pkg.name}</strong>
                          <span>
                            {pkg.versionCount} upstream {pluralize(pkg.versionCount, 'version')} in{' '}
                            {pkg.series.length} series
                          </span>
                        </Flex>
                      </Td>
                    </Tr>
                    <Tr isExpanded={packageExpanded}>
                      <Td colSpan={2} noPadding>
                        <ExpandableRowContent hasNoBackground>
                          <Table
                            aria-label={`${pkg.name} remediation series`}
                            variant='compact'
                            gridBreakPoint=''
                            borders={false}
                            isPlain
                            isNested
                            isExpandable
                            className={[
                              classes.expandableTable,
                              classes.seriesTable,
                              spacing.mtSm,
                              spacing.mlLg,
                            ].join(' ')}
                          >
                            {pkg.series.map((series) => {
                              const seriesKey = JSON.stringify([
                                'series',
                                ecosystem.name,
                                pkg.name,
                                series.name,
                              ]);
                              const seriesExpanded = isRowExpanded(seriesKey);
                              const seriesRowIndex = nextRowIndex++;

                              return (
                                <Tbody key={seriesKey} isExpanded={seriesExpanded}>
                                  <Tr
                                    isControlRow
                                    isContentExpanded={seriesExpanded}
                                    isClickable
                                    onRowClick={() => toggleRow(seriesKey)}
                                  >
                                    <Td
                                      expand={{
                                        rowIndex: seriesRowIndex,
                                        isExpanded: seriesExpanded,
                                        expandId: 'advisory-expand-',
                                        onToggle: (event) => {
                                          event.stopPropagation();
                                          toggleRow(seriesKey);
                                        },
                                      }}
                                    />
                                    <Td dataLabel='Series'>
                                      <Flex
                                        id={`simple-node${seriesRowIndex}`}
                                        alignItems={{ default: 'alignItemsCenter' }}
                                        gap={{ default: 'gapXl' }}
                                      >
                                        <strong>{series.name}</strong>
                                        <span>
                                          {series.versions.length}{' '}
                                          {pluralize(series.versions.length, 'version')}
                                        </span>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                  <Tr isExpanded={seriesExpanded}>
                                    <Td colSpan={2} noPadding>
                                      <ExpandableRowContent hasNoBackground>
                                        <Table
                                          aria-label={`${pkg.name} ${series.name} remediations`}
                                          variant='compact'
                                          borders={false}
                                          isPlain
                                          isNested
                                          className={[
                                            classes.table,
                                            spacing.mtSm,
                                            spacing.mbMd,
                                            spacing.mlLg,
                                            sizing.wAuto,
                                          ].join(' ')}
                                        >
                                          <Thead>
                                            <Tr>
                                              <Th>Upstream version</Th>
                                              <Th>Latest Lightwell release</Th>
                                            </Tr>
                                          </Thead>
                                          <Tbody>
                                            {series.versions.map((version) => (
                                              <Tr key={version.upstreamVersion}>
                                                <Td dataLabel='Upstream version'>
                                                  <Flex
                                                    alignItems={{ default: 'alignItemsCenter' }}
                                                    justifyContent={{
                                                      default: 'justifyContentSpaceBetween',
                                                    }}
                                                    gap={{ default: 'gapLg' }}
                                                  >
                                                    <Label isCompact variant='outline'>
                                                      {version.upstreamVersion}
                                                    </Label>
                                                    <Icon aria-hidden>
                                                      <RhUiArrowRightIcon />
                                                    </Icon>
                                                  </Flex>
                                                </Td>
                                                <Td dataLabel='Latest Lightwell release'>
                                                  <CopyLabel copyText={version.lightwellRelease}>
                                                    {version.lightwellRelease}
                                                  </CopyLabel>
                                                </Td>
                                              </Tr>
                                            ))}
                                          </Tbody>
                                        </Table>
                                      </ExpandableRowContent>
                                    </Td>
                                  </Tr>
                                </Tbody>
                              );
                            })}
                          </Table>
                        </ExpandableRowContent>
                      </Td>
                    </Tr>
                  </Tbody>
                );
              })}
            </Table>
          </div>
        ))
      ) : (
        <LightwellEmptyState
          variant='noMatch'
          displayedItemsName='remediations'
          callToAction={{
            label: 'Clear filters',
            onClick: clearFilters,
          }}
        />
      )}
    </div>
  );
};

export default AdvisoryRemediationsTab;
