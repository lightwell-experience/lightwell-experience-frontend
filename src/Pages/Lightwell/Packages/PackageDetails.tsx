import {
  Breadcrumb,
  BreadcrumbItem,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownList,
  Grid,
  GridItem,
  Label,
  MenuToggle,
  PageBreadcrumb,
  PageSection,
  Tab,
  TabContent,
  TabContentBody,
  Tabs,
  TabTitleText,
  Truncate,
} from '@patternfly/react-core';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { CodeIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { createUseStyles } from 'react-jss';
import { createRef, useLayoutEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import Loader from 'components/Loader';
import LightwellEmptyState from '../components/LightwellEmptyState';
import LightwellNotFound from '../components/LightwellNotFound';
import {
  useMavenPackageVersionsListQuery,
  usePythonPackageVersionsQuery,
} from 'services/Content/ContentQueries';
import { LIGHTWELL_USE_MOCK } from '../constants';
import {
  formatDistributionUrl,
  formatRepositoryName,
  getEcosystemIcon,
  getRepositoryNameFromPathSlug,
  hasBackportedFixes,
} from '../helpers';
import {
  getMockLightwellPackages,
  getMockMavenPackageVersionsList,
  getMockPythonPackageVersions,
} from '../mockPackages';
import ConnectRepositoryModal from '../Repositories/components/ConnectRepositoryModal';
import useLightwellRepository from '../../../Hooks/Lightwell/useLightwellRepository';
import PackageOverviewTab from './tabs/PackageOverviewTab';
import PackageReleasesTab from './tabs/PackageReleasesTab';
import PackageRemediationsTab from './tabs/PackageRemediationsTab';
import PackageSidebar from './components/PackageSidebar';
import PackageVersionsTab from './tabs/PackageVersionsTab';
import AdvisoryDetailsDrawer from './AdvisoryDetailsDrawer';
import { formatReleaseCopyText, getPackageCoordinate, pluralize } from './utils/format';
import { usePackageRemediations } from './hooks/usePackageRemediations';
import {
  lightwellReleaseNum,
  pythonLightwellRelease,
  sortVersionsDesc,
  stripLightwellVersionSuffix,
  toLightwellRelease,
} from './utils/versions';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';
import {
  LwButtonGroup,
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
} from 'kit/components/assemblies';
import { LwAlert, LwButton, LwCard } from 'kit/components/primitives';
import { useLightwellNavigateTo } from 'Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { appendSearchParams, parseSearchParams } from 'Hooks/Lightwell/lightwellPackagesParams';

const useStyles = createUseStyles({
  detailCard: {
    overflow: 'visible',
  },
});

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

// `builds[].release` is `rhlw.2`. Pip publishes that as `3.0.1+rhlw.2`.
const pythonPublishedRelease = (release: string) =>
  !release || release.startsWith('+') || release.startsWith('.') ? release : `+${release}`;

const PackageDetails = () => {
  const classes = useStyles();
  const { navigateTo } = useLightwellNavigateTo();
  const rootPath = useLightwellRootPath();
  const [searchParams] = useSearchParams();
  const packagesParams = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const {
    repoName: repoSlug = '',
    group: groupParam = '',
    packageName: packageNameParam = '',
  } = useParams();

  const packageName = packageNameParam ? decodeURIComponent(packageNameParam) : '';
  const packageGroup = decodeURIComponent(groupParam);

  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);

  const overviewTabRef = createRef<HTMLElement>();
  const releasesTabRef = createRef<HTMLElement>();
  const versionsTabRef = createRef<HTMLElement>();
  const remediationsTabRef = createRef<HTMLElement>();

  const useMock = LIGHTWELL_USE_MOCK;

  const {
    repository,
    repoUUID,
    isLoading: isResolvingRepository,
    isError,
    error,
  } = useLightwellRepository(repoSlug);

  const isMaven = repository?.content_type === 'maven';
  const isPython = repository?.content_type === 'python';

  const packageCoordinate = getPackageCoordinate({
    name: packageName,
    group: packageGroup,
    isMaven,
  });

  const hasValidPackagePath =
    Boolean(packageName) && ((isMaven && Boolean(packageGroup)) || (isPython && !packageGroup));

  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');

  const breadcrumbRepoName = repository
    ? formatRepositoryName(repository.content_type, repository.security_level, repository.name)
    : '';
  const breadcrumbPackageName = packageCoordinate || '';
  const breadcrumbPackagePath =
    isMaven && packageGroup
      ? `${rootPath}/${repoSlug}/${encodeURIComponent(packageGroup)}/${encodeURIComponent(packageName)}`
      : `${rootPath}/${repoSlug}/${encodeURIComponent(packageName)}`;

  const breadcrumbs = useMemo(
    () => [
      { pathname: rootPath, title: 'Lightwell Repositories' },
      {
        pathname: appendSearchParams(`${rootPath}/${repoSlug}`, packagesParams),
        title: breadcrumbRepoName,
      },
      { pathname: breadcrumbPackagePath, title: breadcrumbPackageName },
    ],
    [
      rootPath,
      repoSlug,
      breadcrumbRepoName,
      breadcrumbPackagePath,
      breadcrumbPackageName,
      packagesParams,
    ],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const mavenVersionsListQuery = useMavenPackageVersionsListQuery(
    repoUUID,
    packageGroup,
    packageName,
    !useMock,
  );

  const pythonPackageVersionsQuery = usePythonPackageVersionsQuery(
    repoUUID,
    packageName,
    isPython && !!repoUUID && !!packageName && !useMock,
  );

  const mockMavenVersionsList = useMemo(
    () =>
      useMock && isMaven
        ? getMockMavenPackageVersionsList(repoUUID, packageGroup, packageName)
        : undefined,
    [useMock, isMaven, repoUUID, packageGroup, packageName],
  );

  const mockPythonVersions = useMemo(
    () => (useMock && isPython ? getMockPythonPackageVersions(repoUUID, packageName) : undefined),
    [useMock, isPython, repoUUID, packageName],
  );

  const mavenVersionsData = useMock ? mockMavenVersionsList : mavenVersionsListQuery.data;
  const pythonVersionsData = useMock ? mockPythonVersions : pythonPackageVersionsQuery.data;

  const mavenVersions = useMemo(() => {
    if (!isMaven || !mavenVersionsData?.versions) return [];
    return sortVersionsDesc(mavenVersionsData.versions.map((v) => v.version));
  }, [isMaven, mavenVersionsData?.versions]);

  const mavenAllReleases = useMemo(() => {
    if (!isMaven || !mavenVersionsData?.versions) return [];
    return mavenVersionsData.versions.flatMap((v) => v.builds);
  }, [isMaven, mavenVersionsData?.versions]);

  const pythonVersionItems = pythonVersionsData?.versions;
  // Rows with missing or empty `builds` stay on the stored-version path.
  const pythonUsesBuilds = (pythonVersionItems ?? []).some(
    (version) => (version.builds?.length ?? 0) > 0,
  );

  const pythonVersionsFromApi = useMemo(
    () => pythonVersionItems?.map((version) => version.version) ?? [],
    [pythonVersionItems],
  );

  const pythonVersions = useMemo(() => {
    if (pythonUsesBuilds) {
      return sortVersionsDesc((pythonVersionItems ?? []).map((version) => version.version));
    }

    const versions = useMock
      ? (getMockLightwellPackages(repoUUID).find((pkg) => pkg.name === packageName)?.versions ?? [])
      : pythonVersionsFromApi;
    return sortVersionsDesc([...new Set(versions.map(stripLightwellVersionSuffix))]);
  }, [pythonUsesBuilds, pythonVersionItems, useMock, repoUUID, packageName, pythonVersionsFromApi]);

  const pythonVersionReleases = useMemo(() => {
    if (pythonUsesBuilds) {
      return (pythonVersionItems ?? []).flatMap((version) =>
        (version.builds ?? []).map((build) => ({
          version: version.version,
          release: pythonPublishedRelease(build.release),
          created_at: build.created_at,
        })),
      );
    }

    return (pythonVersionItems ?? []).map((version) => ({
      version: stripLightwellVersionSuffix(version.version),
      release: pythonLightwellRelease(version.version),
      created_at: version.last_updated,
    }));
  }, [pythonUsesBuilds, pythonVersionItems]);

  const packageVersion = isMaven ? (mavenVersions[0] ?? '') : (pythonVersions[0] ?? '');

  const activeVersion = selectedVersion || packageVersion;

  const mavenDetail = mavenVersionsData?.versions.find((v) => v.version === activeVersion);

  const hasRelease = isMaven
    ? (mavenDetail?.builds ?? []).some((build) => !!build.release)
    : pythonUsesBuilds
      ? pythonVersionReleases.some(
          (release) => release.version === activeVersion && !!release.release,
        )
      : hasBackportedFixes(repository?.security_level) &&
        pythonVersionReleases.some(
          (release) => release.version === activeVersion && !!release.release,
        );

  // Content list lookups keep the previous repository while the next one loads.
  // Advisory data is only for the route's repository, and only when it is remediated.
  const repositoryMatchesRoute = repository?.name === getRepositoryNameFromPathSlug(repoSlug);
  const showRemediationsTab =
    repositoryMatchesRoute && hasRelease && repository?.security_level === 'remediated';

  useLayoutEffect(() => {
    if (!showRemediationsTab && activeTabKey === 2) {
      setActiveTabKey(0);
    }
  }, [showRemediationsTab, activeTabKey]);

  const mavenBuilds = useMemo(() => {
    if (!isMaven || !hasRelease || !mavenVersionsData?.versions) return [];

    return mavenVersionsData.versions
      .filter((v) => v.version === activeVersion)
      .flatMap((v) => v.builds)
      .sort((a, b) => lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release));
  }, [isMaven, hasRelease, mavenVersionsData?.versions, activeVersion]);

  const pythonBuilds = useMemo(
    () =>
      hasRelease
        ? pythonVersionReleases
            .filter((release) => release.version === activeVersion && release.release)
            .sort((a, b) => lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release))
        : [],
    [hasRelease, pythonVersionReleases, activeVersion],
  );

  const pythonDetail = useMemo(() => {
    if (pythonUsesBuilds) {
      return pythonVersionItems?.find((version) => version.version === activeVersion);
    }

    return pythonVersionItems?.find(
      (version) =>
        version.version === (pythonBuilds[0] ? toLightwellRelease(pythonBuilds[0]) : activeVersion),
    );
  }, [pythonUsesBuilds, pythonVersionItems, pythonBuilds, activeVersion]);

  const versionOptions = isPython ? pythonVersions : mavenVersions;

  useLayoutEffect(() => {
    if (!versionOptions.length) {
      return;
    }

    if (!selectedVersion || !versionOptions.includes(selectedVersion)) {
      setSelectedVersion(versionOptions[0]);
    }
  }, [versionOptions, selectedVersion]);

  const isLoadingDetail = useMock
    ? false
    : isMaven
      ? mavenVersionsListQuery.isLoading
      : pythonPackageVersionsQuery.isLoading && !pythonPackageVersionsQuery.data;

  const isFetchingDetail =
    !useMock &&
    Boolean(isMaven ? mavenVersionsListQuery.isFetching : pythonPackageVersionsQuery.isFetching);

  const isErrorDetail =
    !useMock &&
    Boolean(isMaven ? mavenVersionsListQuery.isError : pythonPackageVersionsQuery.isError);

  const builds = isMaven ? (hasRelease ? mavenBuilds : (mavenDetail?.builds ?? [])) : pythonBuilds;
  const latestBuild = builds[0];
  const latestRelease = latestBuild?.release ? toLightwellRelease(latestBuild) : undefined;

  const remediationsParams = {
    name: packageName,
    version: activeVersion,
    repository: repositoryMatchesRoute ? (repository?.name ?? '') : '',
    group: packageGroup,
    isPython,
    latestPackageRelease: latestRelease,
  };

  const remediationsQueryEnabled = Boolean(
    showRemediationsTab &&
    !isResolvingRepository &&
    !isError &&
    repository &&
    repoUUID &&
    hasValidPackagePath &&
    !isLoadingDetail &&
    !isErrorDetail &&
    packageName &&
    activeVersion &&
    versionOptions.includes(activeVersion),
  );

  const releaseBuilds = isPython ? pythonBuilds : mavenBuilds;

  const {
    data: packageRemediations,
    summary: remediationSummary,
    hasData: hasRemediationsData,
    isLoading: isLoadingRemediations,
    isFetching: isFetchingRemediations,
    isPlaceholderData: isPlaceholderRemediations,
    isError: isRemediationsError,
  } = usePackageRemediations(remediationsParams, { enabled: remediationsQueryEnabled });

  const remediationsUnavailable = isRemediationsError && !hasRemediationsData;
  const summaryUnavailable = isLoadingRemediations || remediationsUnavailable;

  const fixes = summaryUnavailable ? 0 : remediationSummary.fixes;
  const releases = summaryUnavailable ? 0 : releaseBuilds.filter((build) => !!build.release).length;

  if (isResolvingRepository || (repository && !repositoryMatchesRoute)) {
    return <Loader />;
  }

  if (isError) throw error;

  if (!repository || !repoUUID || !hasValidPackagePath) {
    return <LightwellNotFound />;
  }

  const upstreamVersion = isMaven ? (latestBuild?.version ?? activeVersion) : activeVersion;

  const displayVersion =
    (isMaven || pythonUsesBuilds) && hasRelease && latestBuild
      ? toLightwellRelease(latestBuild)
      : activeVersion;

  const lastUpdated = pythonUsesBuilds
    ? (pythonVersionReleases
        .filter((release) => release.version === activeVersion)
        .map((build) => build.created_at)
        .sort()
        .at(-1) ?? '')
    : isMaven
      ? (builds
          .map((build) => build.created_at)
          .sort()
          .at(-1) ?? '')
      : (pythonDetail?.last_updated ?? '');

  const detailReady = !isLoadingDetail;
  const hasVersionsData = isMaven ? !!mavenVersionsData : !!pythonVersionsData;
  const doneLoading = detailReady && (hasVersionsData || (isErrorDetail && !isFetchingDetail));

  const hasDetail =
    detailReady &&
    (isMaven
      ? builds.length > 0 || (!hasRelease && mavenVersions.length > 0)
      : pythonVersions.length > 0);

  const showEmpty = doneLoading && !hasDetail;

  const showVersionsTab = isMaven
    ? !hasRelease
    : isPython && !hasRelease && pythonVersions.length > 0;

  const showReleasesTab = hasRelease && (isMaven || isPython);

  if (!doneLoading) {
    return <Loader />;
  }

  const singleVersionLabel =
    versionOptions.length === 1 && (selectedVersion || activeVersion)
      ? isMaven && hasRelease
        ? upstreamVersion
        : selectedVersion || activeVersion
      : '';

  return (
    <AdvisoryDetailsDrawer
      preferredRecord={{
        repository: repository.name,
        packageName: packageCoordinate,
        packageVersion: activeVersion,
      }}
    >
      {!appBreadcrumbsEnabled && (
        <PageBreadcrumb isWidthLimited>
          <Breadcrumb ouiaId='lightwell-package-details-breadcrumb'>
            <BreadcrumbItem component='button' onClick={() => navigateTo('repositories')}>
              Lightwell Repositories
            </BreadcrumbItem>
            <BreadcrumbItem
              component='button'
              onClick={() => navigateTo('repositoryPackages', { repoSlug, packagesParams })}
            >
              {breadcrumbRepoName}
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              <Truncate content={packageCoordinate || '—'} />
            </BreadcrumbItem>
          </Breadcrumb>
        </PageBreadcrumb>
      )}
      <LwPageHeader>
        <PageChromeSlots>
          <PageChromeSlot>
            <PageTitleStack
              title={packageCoordinate || 'Package details'}
              icon={getEcosystemIcon(repository.content_type)}
              description={
                hasRelease ? (
                  // keep this mounted so hiding the description doesn't cause a layout shift when switching versions
                  <span
                    data-ouia-component-id='lightwell-package-fix-summary'
                    style={{ visibility: fixes > 0 ? 'visible' : 'hidden' }}
                    aria-hidden={fixes <= 0}
                  >
                    <strong>{fixes}</strong> {pluralize(fixes, 'fix', 'fixes')} across{' '}
                    <strong>{releases}</strong> Lightwell {pluralize(releases, 'release')}
                  </span>
                ) : null
              }
              ouiaId='lightwell-package-details-header'
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

                {singleVersionLabel ? <Label variant='outline'>{singleVersionLabel}</Label> : null}
                {versionOptions.length > 1 ? (
                  <Dropdown
                    isScrollable
                    onSelect={(_e, val) => {
                      setSelectedVersion(val as string);
                      setVersionDropdownOpen(false);
                    }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setVersionDropdownOpen((prev) => !prev)}
                        isExpanded={versionDropdownOpen}
                        ouiaId='lightwell-version-selector'
                      >
                        {selectedVersion || activeVersion}
                      </MenuToggle>
                    )}
                    onOpenChange={(isOpen) => setVersionDropdownOpen(isOpen)}
                    isOpen={versionDropdownOpen}
                  >
                    <DropdownList>
                      {versionOptions.map((v) => (
                        <DropdownItem key={v} value={v} isSelected={selectedVersion === v}>
                          {v}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                ) : null}
              </LwButtonGroup>
              {(repository.security_level === 'remediated' ||
                repository.security_level === 'predisclosure') && <LwAlert />}
            </PageChromeSlotFooter>
          </PageChromeSlot>
        </PageChromeSlots>
      </LwPageHeader>

      {showEmpty || hasDetail ? (
        <PageSection hasBodyWrapper={false} aria-label='Package details'>
          {showEmpty ? (
            <LightwellEmptyState
              variant='empty'
              displayedItemsName='package details'
              bodyText='No details available yet for this package.'
            />
          ) : null}

          {hasDetail ? (
            <LwCard className={`${classes.detailCard} ${spacing.mxLg} ${spacing.mbLg}`}>
              <CardBody>
                <Grid hasGutter>
                  <GridItem md={8}>
                    <Tabs
                      activeKey={activeTabKey}
                      onSelect={(_, eventKey) => setActiveTabKey(eventKey as number)}
                      aria-label='Package detail tabs'
                      ouiaId='lightwell-package-detail-tabs'
                    >
                      <Tab
                        eventKey={0}
                        title={<TabTitleText>Overview</TabTitleText>}
                        tabContentRef={overviewTabRef}
                        ouiaId='lightwell-package-overview-tab'
                      />
                      {showReleasesTab && (
                        <Tab
                          eventKey={1}
                          title={<TabTitleText>Releases</TabTitleText>}
                          tabContentRef={releasesTabRef}
                          ouiaId='lightwell-package-releases-tab'
                        />
                      )}
                      {showVersionsTab && (
                        <Tab
                          eventKey={1}
                          title={<TabTitleText>Versions</TabTitleText>}
                          tabContentRef={versionsTabRef}
                          ouiaId='lightwell-package-versions-tab'
                        />
                      )}
                      {showRemediationsTab && (
                        <Tab
                          eventKey={2}
                          title={<TabTitleText>Remediations</TabTitleText>}
                          tabContentRef={remediationsTabRef}
                          ouiaId='lightwell-package-remediations-tab'
                        />
                      )}
                    </Tabs>
                    <>
                      <TabContent
                        eventKey={0}
                        id='lightwell-package-overview-panel'
                        ref={overviewTabRef}
                        aria-label='Overview'
                      >
                        <TabContentBody hasPadding>
                          <PackageOverviewTab
                            isMaven={isMaven}
                            group={packageGroup}
                            name={packageName}
                            latestRelease={displayVersion}
                            packageVersion={upstreamVersion}
                            hasRelease={hasRelease}
                            summary={isMaven ? mavenDetail?.summary : pythonDetail?.summary}
                            sourceUrl={formatDistributionUrl(
                              repository.published_distribution_url ?? '',
                            )}
                            repository={{
                              uuid: repository.uuid,
                              name: repository.name,
                              published_distribution_url: formatDistributionUrl(
                                repository.published_distribution_url ?? '',
                              ),
                              content_type: repository.content_type ?? '',
                              security_level: repository.security_level,
                            }}
                          />
                        </TabContentBody>
                      </TabContent>
                      {showReleasesTab && (
                        <TabContent
                          eventKey={1}
                          id='lightwell-package-releases-panel'
                          ref={releasesTabRef}
                          aria-label='Releases'
                          hidden
                        >
                          <TabContentBody hasPadding>
                            <PackageReleasesTab
                              version={upstreamVersion}
                              builds={releaseBuilds}
                              isLoading={isLoadingDetail}
                              packageCoordinate={{
                                name: packageName,
                                group: packageGroup,
                                isPython,
                              }}
                            />
                          </TabContentBody>
                        </TabContent>
                      )}
                      {showVersionsTab && (
                        <TabContent
                          eventKey={1}
                          id='lightwell-package-versions-panel'
                          ref={versionsTabRef}
                          aria-label='Versions'
                          hidden
                        >
                          <TabContentBody hasPadding>
                            <PackageVersionsTab
                              currentVersion={selectedVersion || activeVersion}
                              versions={versionOptions}
                              latestReleases={isPython ? pythonVersionReleases : mavenAllReleases}
                              onVersionSelect={setSelectedVersion}
                            />
                          </TabContentBody>
                        </TabContent>
                      )}
                      {showRemediationsTab && (
                        <TabContent
                          eventKey={2}
                          id='lightwell-package-remediations-panel'
                          ref={remediationsTabRef}
                          aria-label='Remediations'
                          hidden
                        >
                          <TabContentBody hasPadding>
                            <PackageRemediationsTab
                              key={`${repository.name}-${packageName}-${activeVersion}`}
                              name={packageName}
                              version={activeVersion}
                              remediations={packageRemediations}
                              isLoading={isLoadingRemediations}
                              isFetching={isFetchingRemediations}
                              isPlaceholderData={isPlaceholderRemediations}
                              formatCopyText={(version) =>
                                formatReleaseCopyText(
                                  { name: packageName, group: packageGroup, isPython },
                                  version,
                                )
                              }
                            />
                          </TabContentBody>
                        </TabContent>
                      )}
                    </>
                  </GridItem>
                  <GridItem md={4}>
                    <PackageSidebar
                      lastUpdated={lastUpdated}
                      groupId={packageGroup}
                      upstreamVersion={upstreamVersion}
                      allVersions={
                        isMaven && !hasRelease
                          ? mavenVersions
                          : isPython && pythonVersions.length > 1
                            ? pythonVersions
                            : undefined
                      }
                      license={isMaven ? mavenDetail?.license : pythonDetail?.license}
                      author={isMaven ? mavenDetail?.author : pythonDetail?.author?.name}
                      projectUrl={isMaven ? mavenDetail?.project_url : pythonDetail?.project_url}
                      hasRelease={hasRelease}
                    />
                  </GridItem>
                </Grid>
              </CardBody>
            </LwCard>
          ) : null}
        </PageSection>
      ) : null}
    </AdvisoryDetailsDrawer>
  );
};

export default PackageDetails;
