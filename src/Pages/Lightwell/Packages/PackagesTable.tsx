import {
  Flex,
  Grid,
  Pagination,
  PaginationVariant,
  SearchInput,
  Stack,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Timestamp,
  PageBreadcrumb,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { CodeIcon } from '@patternfly/react-icons';
import { SkeletonTable } from '@patternfly/react-component-groups';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import { createUseStyles } from 'react-jss';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableVariant,
  Tr,
  Td,
  Thead,
  Th,
  Tbody,
  type BaseCellProps,
  type ThProps,
} from '@patternfly/react-table';

import { useLightwellRepositoryPackagesQuery } from 'services/Content/ContentQueries';
import { RepositoryPackageItem } from 'services/Content/ContentApi';
import { getMockLightwellPackages } from '../mockPackages';
import {
  formatDistributionUrl,
  formatPythonDisplayUrl,
  formatRepositoryName,
  getEcosystemIcon,
  getRepositoryDescription,
  hasBackportedFixes,
} from '../helpers';
import Hide from 'components/Hide/Hide';
import { LIGHTWELL_USE_MOCK, lightwellPkgsPerPageKey } from '../constants';
import EmptyTableState from 'components/EmptyTableState/EmptyTableState';
import Loader from 'components/Loader';
import LightwellNotFound from '../components/LightwellNotFound';
import ConnectRepositoryModal from '../Repositories/components/ConnectRepositoryModal';
import CopyLabel from './components/CopyLabel';
import type { PackageCoordinate } from './types';
import { formatReleaseCopyText, getPackageCoordinate } from './utils/format';
import {
  compareReleasesDesc,
  pythonLightwellRelease,
  sortVersionsDesc,
  stripLightwellVersionSuffix,
  toLightwellRelease,
} from './utils/versions';
import useLightwellRepository from '../../../Hooks/Lightwell/useLightwellRepository';
import { useLightwellNavigateTo } from '../../../Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';
import { useLightwellPackagesParams } from '../../../Hooks/Lightwell/useLightwellPackagesParams';
import {
  lightwellPackagesSortQuery,
  type LightwellPackagesSortBy,
} from '../../../Hooks/Lightwell/lightwellPackagesParams';
import {
  LwButtonGroup,
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
} from 'kit/components/assemblies';
import { LwAlert, LwButton, LwCard, LwClipboardCopy } from 'kit/components/primitives';

const useStyles = createUseStyles({
  filterToolbarItem: {
    minWidth: '18rem',
    '& .pf-v6-c-search-input': {
      width: '100%',
    },
  },
});

type MappedRelease = {
  version: string;
  release: string;
};

type MappedPackage = {
  group_id: string;
  name: string;
  versions: string[];
  latest_releases: MappedRelease[];
  last_updated: string;
};

type PackageColumnHeader = {
  title: string;
  width?: BaseCellProps['width'];
  sortBy?: LightwellPackagesSortBy;
};

const mapRepositoryPackage = (
  pkg: RepositoryPackageItem,
  isPythonWithFixes: boolean,
): MappedPackage => {
  const latestCreatedAt = pkg.latest_releases
    .map((release) => release.created_at)
    .sort()
    .at(-1);

  const sortedReleases = pkg.latest_releases
    .map((release) =>
      isPythonWithFixes
        ? {
            ...release,
            version: stripLightwellVersionSuffix(release.version),
            release: release.release || pythonLightwellRelease(release.version),
          }
        : release,
    )
    .sort(compareReleasesDesc);

  const seenVersions = new Set<string>();
  const latestReleasePerVersion = sortedReleases.filter((release) => {
    if (seenVersions.has(release.version)) return false;
    seenVersions.add(release.version);
    return true;
  });

  const sortedVersions =
    latestReleasePerVersion.length > 0
      ? latestReleasePerVersion.map((release) => release.version)
      : sortVersionsDesc(
          isPythonWithFixes
            ? [...new Set(pkg.versions.map(stripLightwellVersionSuffix))]
            : pkg.versions,
        );

  return {
    group_id: pkg.group,
    name: pkg.name,
    versions: sortedVersions,
    latest_releases: latestReleasePerVersion.map((release) => ({
      version: release.version,
      release: release.release,
    })),
    last_updated: latestCreatedAt ?? '',
  };
};

type StackedItemsCellProps<T> = {
  items: T[];
  packageKey: string;
  isCollapsed: boolean;
  onToggle: (key: string) => void;
  showToggle?: boolean;
  renderItem?: (item: T) => ReactNode;
  getItemKey?: (item: T) => string;
};

type PackageCopyLabelProps = {
  packageCoordinate: PackageCoordinate;
  version: string;
};

const PackageCopyLabel = ({ packageCoordinate, version }: PackageCopyLabelProps) => (
  <CopyLabel copyText={formatReleaseCopyText(packageCoordinate, version)}>{version}</CopyLabel>
);

const StackedItemsCell = <T,>({
  items,
  packageKey,
  isCollapsed,
  onToggle,
  showToggle = false,
  renderItem = (item) => String(item),
  getItemKey = (item) => String(item),
}: StackedItemsCellProps<T>) => {
  if (items.length === 0) {
    return <>—</>;
  }

  if (items.length === 1) {
    return <>{renderItem(items[0])}</>;
  }

  const [primary, ...rest] = items;
  const isExpanded = !isCollapsed;

  return (
    <Flex
      direction={{ default: 'column' }}
      alignItems={{ default: 'alignItemsFlexStart' }}
      gap={{ default: 'gapXs' }}
    >
      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
        <span>{renderItem(primary)}</span>
        {showToggle && (
          <LwButton variant='link' isInline onClick={() => onToggle(packageKey)}>
            {isExpanded ? 'hide' : `${rest.length} more`}
          </LwButton>
        )}
      </Flex>
      {isExpanded && rest.map((item) => <span key={getItemKey(item)}>{renderItem(item)}</span>)}
    </Flex>
  );
};

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const PackagesTable = () => {
  const classes = useStyles();

  const { repoName: repoSlug = '' } = useParams();
  const { navigateTo } = useLightwellNavigateTo();
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    page,
    setPage,
    onSetPage,
    packagesParams,
    sortBy,
    sortDirection,
    onSort,
  } = useLightwellPackagesParams();

  const storedPerPage = Number(localStorage.getItem(lightwellPkgsPerPageKey)) || 20;
  const [perPage, setPerPage] = useState(storedPerPage);

  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const useMock = LIGHTWELL_USE_MOCK;

  const {
    repository,
    repoUUID,
    isLoading: isResolvingRepository,
    isError,
    error,
  } = useLightwellRepository(repoSlug);

  const apiPackagesQuery = useLightwellRepositoryPackagesQuery(
    repoUUID,
    page,
    perPage,
    debouncedSearch,
    lightwellPackagesSortQuery(sortBy, sortDirection),
    !!repoUUID && !useMock,
  );

  const {
    data: packagesData,
    isLoading: isPackagesLoading,
    isFetching: isPackagesFetching,
    isPlaceholderData,
  } = apiPackagesQuery;

  const isPythonWithFixes =
    repository?.content_type === 'python' && hasBackportedFixes(repository?.security_level);

  const { packages, packageCount } = useMemo(() => {
    if (useMock) {
      const mockPackages = getMockLightwellPackages(repoUUID, debouncedSearch);
      const offset = (page - 1) * perPage;
      return {
        packages: mockPackages
          .slice(offset, offset + perPage)
          .map((pkg) => mapRepositoryPackage(pkg, isPythonWithFixes)),
        packageCount: mockPackages.length,
      };
    }

    const results = packagesData?.results ?? [];
    return {
      packages: results.map((pkg) => mapRepositoryPackage(pkg, isPythonWithFixes)),
      packageCount: packagesData?.total ?? 0,
    };
  }, [useMock, repoUUID, debouncedSearch, page, perPage, packagesData, isPythonWithFixes]);

  const rootPath = useLightwellRootPath();
  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbRepoName = repository
    ? formatRepositoryName(repository.content_type, repository.security_level, repository.name)
    : '';

  const breadcrumbs = useMemo(
    () => [
      { pathname: rootPath, title: 'Lightwell Repositories' },
      { pathname: `${rootPath}/${repoSlug}`, title: breadcrumbRepoName },
    ],
    [rootPath, repoSlug, breadcrumbRepoName],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const countIsZero = packageCount === 0;
  const showPagination = packages.length > 0;
  // First load, or a refetch with nothing to keep on screen. Search and page changes
  // that already have rows stay mounted so the page does not jump.
  const showSkeleton =
    !useMock && (isPackagesLoading || (isPackagesFetching && isPlaceholderData && countIsZero));

  if (isResolvingRepository) {
    return <Loader />;
  }

  if (isError) throw error;

  if (!repository || !repoUUID) {
    return <LightwellNotFound />;
  }

  if (!useMock && apiPackagesQuery.isError) throw apiPackagesQuery.error;

  const showEmptyState = countIsZero && !showSkeleton;

  const onPerPageSelect = (_, newPerPage: number, newPage: number) => {
    localStorage.setItem(lightwellPkgsPerPageKey, newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const paginationProps = {
    itemCount: packageCount,
    perPage,
    page,
    onSetPage,
    onPerPageSelect,
  };

  const togglePackageExpanded = (packageKey: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(packageKey)) {
        next.delete(packageKey);
      } else {
        next.add(packageKey);
      }
      return next;
    });
  };

  const repositoryName = formatRepositoryName(
    repository.content_type,
    repository.security_level,
    repository.name,
  );
  const isRemediated = repository.security_level === 'remediated';
  const isPredisclosure = repository.security_level === 'predisclosure';
  const showReleaseColumn = isRemediated || isPredisclosure;
  const isMaven = repository.content_type === 'maven';
  const isPython = repository.content_type === 'python';

  const columnHeaders: PackageColumnHeader[] = [
    { title: 'Package', width: 25, sortBy: 'name' },
    { title: 'Version', width: 15 },
    ...(showReleaseColumn
      ? [{ title: 'Latest release', width: 20 as BaseCellProps['width'] }]
      : []),
    { title: 'Last updated', width: 15, sortBy: 'last_updated' },
  ];

  const activeSortIndex = columnHeaders.findIndex((column) => column.sortBy === sortBy);

  const sortParams = (columnIndex: number): ThProps['sort'] | undefined => {
    if (!columnHeaders[columnIndex]?.sortBy) return undefined;

    return {
      sortBy: {
        index: activeSortIndex,
        direction: sortDirection,
        defaultDirection: columnHeaders[columnIndex]?.sortBy === 'last_updated' ? 'desc' : 'asc',
      },
      onSort: (_event, index, direction) => {
        const nextSortBy = columnHeaders[index]?.sortBy;
        if (!nextSortBy) return;
        onSort(nextSortBy, direction);
      },
      columnIndex,
    };
  };

  return (
    <>
      {!appBreadcrumbsEnabled && (
        <PageBreadcrumb isWidthLimited>
          <Breadcrumb ouiaId='lightwell-packages-breadcrumb'>
            <BreadcrumbItem component='button' onClick={() => navigateTo('repositories')}>
              Lightwell Repositories
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{breadcrumbRepoName}</BreadcrumbItem>
          </Breadcrumb>
        </PageBreadcrumb>
      )}
      <LwPageHeader>
        <PageChromeSlots>
          <PageChromeSlot>
            <PageTitleStack
              title={repositoryName}
              icon={getEcosystemIcon(repository?.content_type)}
              description={getRepositoryDescription(
                repository.content_type,
                repository.security_level,
              )}
              ouiaId='lightwell-packages-header'
            />
            <PageChromeSlotFooter>
              <LwButtonGroup>
                <ConnectRepositoryModal
                  repository={{
                    uuid: repository.uuid,
                    name: repository.name,
                    published_distribution_url: formatDistributionUrl(
                      repository.published_distribution_url || '',
                    ),
                    content_type: repository.content_type,
                  }}
                >
                  <LwButton variant='secondary' icon={<CodeIcon />}>
                    Connect
                  </LwButton>
                </ConnectRepositoryModal>
                <LwClipboardCopy isCode>
                  {repository.content_type === 'python'
                    ? formatPythonDisplayUrl(repository.published_distribution_url || '')
                    : formatDistributionUrl(repository.published_distribution_url || '')}
                </LwClipboardCopy>
              </LwButtonGroup>
              {(isRemediated || isPredisclosure) && <LwAlert />}
            </PageChromeSlotFooter>
          </PageChromeSlot>
        </PageChromeSlots>
      </LwPageHeader>

      <Grid className={`${spacing.pxLg} ${spacing.pbLg}`}>
        <Toolbar ouiaId='lightwell-packages-toolbar'>
          <ToolbarContent>
            <ToolbarItem className={classes.filterToolbarItem}>
              <SearchInput
                id='lightwell-package-filter'
                aria-label={isMaven ? 'Filter by name or group ID' : 'Filter by name'}
                placeholder={isMaven ? 'Filter by name or group ID' : 'Filter by name'}
                value={searchQuery}
                onChange={(_event, value) => setSearchQuery(value)}
                onClear={() => setSearchQuery('')}
              />
            </ToolbarItem>
            <ToolbarItem variant='pagination' align={{ default: 'alignEnd' }}>
              <Hide hide={!showPagination}>
                <Pagination
                  id='lightwell-top-pagination'
                  widgetId='lightwellTopPaginationWidgetId'
                  isCompact
                  {...paginationProps}
                />
              </Hide>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Hide hide={!showSkeleton}>
          <SkeletonTable
            rows={perPage}
            columnsCount={columnHeaders.length}
            variant={TableVariant.compact}
          />
        </Hide>

        <Hide hide={showSkeleton}>
          <Hide hide={countIsZero}>
            <Stack>
              <LwCard className={`${spacing.ptLg} ${spacing.pbXl} ${spacing.pxLg}`}>
                <Stack>
                  <Table
                    aria-label='Lightwell packages table'
                    ouiaId='lightwell-packages-table'
                    isStriped
                  >
                    <Thead>
                      <Tr>
                        {columnHeaders.map(({ title, width }, index) => (
                          <Th
                            key={title + 'column'}
                            width={width}
                            modifier='wrap'
                            sort={sortParams(index)}
                          >
                            {title}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {packages.map((pkg) => {
                        const { name, group_id, versions, latest_releases, last_updated } = pkg;
                        const packageKey = `${group_id}-${name}`;
                        const isCollapsed = !expandedPackages.has(packageKey);
                        const packageCoordinate = getPackageCoordinate({
                          name,
                          group: group_id,
                          isMaven,
                        });

                        const renderCopyLabel = (version: string) => (
                          <PackageCopyLabel
                            packageCoordinate={{ name, group: group_id, isPython }}
                            version={version}
                          />
                        );

                        return (
                          <Tr key={packageKey}>
                            <Td dataLabel={columnHeaders[0].title}>
                              <LwButton
                                variant='link'
                                isInline
                                className={text.fontWeightBold}
                                ouiaId={`lightwell-package-${name}`}
                                onClick={() =>
                                  navigateTo('packageDetails', {
                                    repoSlug,
                                    packageName: name,
                                    groupId: isMaven ? group_id : undefined,
                                    packagesParams,
                                  })
                                }
                              >
                                {packageCoordinate}
                              </LwButton>
                            </Td>
                            <Td dataLabel={columnHeaders[1].title}>
                              <StackedItemsCell
                                items={versions}
                                packageKey={packageKey}
                                isCollapsed={isCollapsed}
                                onToggle={togglePackageExpanded}
                                showToggle
                                renderItem={
                                  repository.security_level === 'validated'
                                    ? renderCopyLabel
                                    : undefined
                                }
                              />
                            </Td>
                            {showReleaseColumn ? (
                              <Td dataLabel={columnHeaders[2].title}>
                                <StackedItemsCell
                                  items={latest_releases}
                                  packageKey={packageKey}
                                  isCollapsed={isCollapsed}
                                  onToggle={togglePackageExpanded}
                                  renderItem={(release) =>
                                    renderCopyLabel(toLightwellRelease(release))
                                  }
                                  getItemKey={(release) => toLightwellRelease(release)}
                                />
                              </Td>
                            ) : null}
                            <Td dataLabel={columnHeaders[showReleaseColumn ? 3 : 2].title}>
                              {last_updated ? (
                                <Timestamp
                                  date={new Date(last_updated)}
                                  dateFormat='medium'
                                  timeFormat='short'
                                  tooltip={{ variant: 'default' }}
                                  style={{ fontSize: 'inherit', textDecoration: 'none' }}
                                >
                                  {dayjs(last_updated).fromNow()}
                                </Timestamp>
                              ) : (
                                '—'
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                  <Hide hide={!showPagination || isPackagesLoading}>
                    <Pagination
                      id='lightwell-bottom-pagination'
                      widgetId='lightwellBottomPaginationWidgetId'
                      variant={PaginationVariant.bottom}
                      isCompact={false}
                      isStatic
                      {...paginationProps}
                    />
                  </Hide>
                </Stack>
              </LwCard>
            </Stack>
          </Hide>
          <Hide hide={!showEmptyState}>
            <Stack>
              <EmptyTableState
                notFiltered={searchQuery === ''}
                clearFilters={() => setSearchQuery('')}
                itemName='packages'
                notFilteredBody='No packages available yet in this repository.'
              />
            </Stack>
          </Hide>
        </Hide>
      </Grid>
    </>
  );
};

export default PackagesTable;
