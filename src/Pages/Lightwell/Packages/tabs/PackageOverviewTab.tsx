import {
  Button,
  ClipboardCopy,
  ClipboardCopyVariant,
  Content,
  Flex,
  Skeleton,
  Stack,
  StackItem,
  Tab,
  TabContent,
  Tabs,
  TabTitleText,
  Title,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import React, { createRef, useMemo, useState } from 'react';

import ConnectRepositoryModal from '../../Repositories/components/ConnectRepositoryModal';
import { ConnectSnippetTab } from '../../Repositories/components/connectSnippets';
import {
  getMavenPackageUsageSnippetTabs,
  getPythonPackageUsageSnippetTabs,
} from '../components/packageDependencySnippets';
import LatestReleaseFixes from '../components/LatestReleaseFixes';
import { fixesCardHeight, fixesCardWidth } from '../components/FixesCard';
import { useLatestReleaseFixes } from '../hooks/useLatestReleaseFixes';
import { getPackageCoordinate } from '../utils/format';
import { getPackageByRepositoryDescription } from '../../helpers';

type PackageOverviewTabProps = {
  isMaven: boolean;
  group: string;
  name: string;
  latestRelease: string;
  packageVersion: string;
  hasRelease: boolean;
  summary?: string;
  sourceUrl?: string;
  repository?: {
    uuid: string;
    name: string;
    published_distribution_url: string;
    content_type: string;
    security_level?: string;
  };
};

const PackageOverviewTab = ({
  isMaven,
  group,
  name,
  latestRelease,
  packageVersion,
  hasRelease,
  summary,
  sourceUrl = '',
  repository,
}: PackageOverviewTabProps) => {
  const tabs = useMemo(
    () =>
      isMaven
        ? getMavenPackageUsageSnippetTabs({
            group,
            name,
            release: latestRelease,
            sourceUrl,
          })
        : getPythonPackageUsageSnippetTabs({
            name,
            release: latestRelease,
            sourceUrl,
          }),
    [isMaven, group, name, latestRelease, sourceUrl],
  );

  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.eventKey ?? '');

  const showLatestReleaseFixes =
    hasRelease && Boolean(latestRelease) && repository?.security_level === 'remediated';

  const packageDescription = getPackageByRepositoryDescription(
    repository?.security_level,
    repository?.content_type ?? (isMaven ? 'maven' : 'python'),
  );

  const packageCoordinate = getPackageCoordinate({ name, group, isMaven });
  const showRenovate =
    isMaven &&
    (repository?.security_level === 'remediated' || repository?.security_level === 'predisclosure');
  const configureBuildToolText = isMaven
    ? showRenovate
      ? 'configure your build tool (Maven, Gradle, Artifactory, Nexus, or Renovate)'
      : 'configure your build tool (Maven, Gradle, Artifactory, or Nexus)'
    : 'configure your build tool (pip, Pipenv, Poetry, uv, Artifactory, or Nexus)';

  const { data: latestReleaseFixes, isLoading: isLoadingAdvisories } = useLatestReleaseFixes({
    repository: repository?.name,
    packageName: packageCoordinate,
    packageVersion,
    enabled: showLatestReleaseFixes && Boolean(packageCoordinate) && Boolean(packageVersion),
  });

  const tabRefs = useMemo(
    () =>
      tabs.reduce(
        (refs, tab) => {
          refs[tab.eventKey] = createRef<HTMLElement>();
          return refs;
        },
        {} as Record<string, React.RefObject<HTMLElement>>,
      ),
    [tabs],
  );

  const renderTabPanel = (tab: ConnectSnippetTab) => (
    <Stack hasGutter>
      {tab.snippets.map((snippet) => (
        <StackItem key={snippet.label}>
          <Content component='p'>{snippet.label}</Content>
          <ClipboardCopy
            isReadOnly
            isCode
            hoverTip='Copy'
            clickTip='Copied'
            variant={ClipboardCopyVariant.expansion}
            isExpanded
          >
            {snippet.code}
          </ClipboardCopy>
        </StackItem>
      ))}
    </Stack>
  );

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <Stack hasGutter>
        <Title headingLevel='h2' size='xl'>
          About this package
        </Title>
        <Content component='p' className={spacing.mb_0}>
          {summary ?? 'Package description not yet available.'}
        </Content>
        {packageDescription && <Content component='p'>{packageDescription}</Content>}
      </Stack>
      {showLatestReleaseFixes && (
        <>
          {isLoadingAdvisories && !latestReleaseFixes && (
            <Skeleton
              height={fixesCardHeight}
              width={fixesCardWidth}
              style={{ maxWidth: '100%' }}
              screenreaderText='Loading package advisories'
            />
          )}
          {latestReleaseFixes && (
            <Stack hasGutter>
              <LatestReleaseFixes
                total={latestReleaseFixes.total}
                counts={latestReleaseFixes.counts}
              />
            </Stack>
          )}
        </>
      )}
      <Stack hasGutter>
        <Title headingLevel='h2' size='xl'>
          How to use
        </Title>
        <Content>
          {repository ? (
            <span>
              First,{' '}
              <ConnectRepositoryModal
                repository={{
                  uuid: repository.uuid,
                  name: repository.name,
                  published_distribution_url: sourceUrl,
                  content_type: repository.content_type,
                }}
              >
                <Button variant='link' isInline>
                  {configureBuildToolText}
                </Button>
              </ConnectRepositoryModal>{' '}
              to use this repository.
            </span>
          ) : (
            <span>{`First, ${configureBuildToolText} to use this repository.`}</span>
          )}
        </Content>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_, eventKey) => setActiveTabKey(eventKey as string)}
          aria-label='Package dependency snippets'
          ouiaId='lightwell-package-dependency-tabs'
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.eventKey}
              eventKey={tab.eventKey}
              title={<TabTitleText>{tab.title}</TabTitleText>}
              tabContentRef={tabRefs[tab.eventKey]}
              ouiaId={`lightwell-dependency-tab-${tab.eventKey}`}
            />
          ))}
        </Tabs>
        {tabs.map((tab, index) => (
          <TabContent
            key={tab.eventKey}
            eventKey={tab.eventKey}
            id={`lightwell-dependency-panel-${tab.eventKey}`}
            aria-label={tab.title}
            ref={tabRefs[tab.eventKey]}
            hidden={index > 0}
            className={spacing.ptSm}
          >
            {renderTabPanel(tab)}
          </TabContent>
        ))}
      </Stack>
    </Flex>
  );
};

export default PackageOverviewTab;
