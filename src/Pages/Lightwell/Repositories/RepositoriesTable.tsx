import {
  Content,
  Flex,
  FlexItem,
  Grid,
  Icon,
  Label,
  PageSection,
  Pagination,
  PaginationVariant,
  Stack,
  Switch,
} from '@patternfly/react-core';
import { CodeIcon, BellIcon } from '@patternfly/react-icons';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { SkeletonTable } from '@patternfly/react-component-groups';
import {
  Table,
  TableVariant,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  type BaseCellProps,
} from '@patternfly/react-table';
import { type ComponentProps, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import text from '@patternfly/react-styles/css/utilities/Text/text';

import EmptyTableState from './components/EmptyTableState';
import Hide from 'components/Hide/Hide';
import { FilterData } from 'services/Content/ContentApi';
import { useContentListQuery } from 'services/Content/ContentQueries';

import {
  LIGHTWELL_DEMO_FEATURE_NAME,
  LIGHTWELL_FEATURE_NAME,
  LIGHTWELL_USE_MOCK,
  lightwellReposPerPageKey,
} from '../constants';
import { useLightwellDemo } from '../LightwellDemoContext';
import {
  getDemoLightwellRepositoryList,
  getMockLightwellRepositoryList,
} from '../mockRepositories';
import {
  getEcosystemIcon,
  getEcosystemFromContentType,
  getRepositoryDescription,
  formatRepositoryName,
  getRepositoryPathSlug,
  getSlugFromRepositoryName,
} from '../helpers';
import ConnectRepositoryModal from './components/ConnectRepositoryModal';
import { capitalize } from 'lodash';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLightwellNavigateTo } from 'Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { useLightwellRootPath } from 'Hooks/Lightwell/navigation/useLightwellRootPath';
import NotificationPreferencesModal from './components/NotificationPreferencesModal';
import {
  LwButtonGroup,
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
} from 'kit/components/assemblies';
import { LwButton, LwCard } from 'kit/components/primitives';
import { useLightwellNotificationPrefs } from './hooks/useLightwellNotificationPrefs';
import {
  mapSeveritiesToApi,
  useLightwellRepoNotifications,
} from './hooks/useLightwellRepoNotifications';

const useStyles = createUseStyles({
  topContainer: {
    justifyContent: 'space-between',
    padding: '16px 24px',
    height: 'fit-content',
  },
  bottomContainer: {
    justifyContent: 'space-between',
  },
});

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const RepositoriesTable = () => {
  const classes = useStyles();
  const isDemo = useLightwellDemo();
  const { navigateTo } = useLightwellNavigateTo();
  const rootPath = useLightwellRootPath();
  const [page, setPage] = useState(1);
  const storedPerPage = Number(localStorage.getItem(lightwellReposPerPageKey)) || 20;
  const [perPage, setPerPage] = useState(storedPerPage);
  const filters: FilterData = {
    feature_name: isDemo ? LIGHTWELL_DEMO_FEATURE_NAME : LIGHTWELL_FEATURE_NAME,
  };

  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbs = useMemo(
    () => [{ pathname: rootPath, title: 'Lightwell Repositories' }],
    [rootPath],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const useMock = LIGHTWELL_USE_MOCK;

  const mockRepositoryListQuery = useQuery({
    queryKey: ['lightwell-repositories-mock', page, perPage, filters, isDemo],
    queryFn: () =>
      isDemo
        ? getDemoLightwellRepositoryList(page, perPage, filters)
        : getMockLightwellRepositoryList(page, perPage, filters),
    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled: useMock,
  });

  // Fetch repositories with the lightwell-network feature
  const apiRepositoryListQuery = useContentListQuery(page, perPage, filters, '', [], !useMock);

  const {
    isLoading,
    isError,
    error,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useMock ? mockRepositoryListQuery : apiRepositoryListQuery;

  const {
    data: repositories = [],
    meta: { count = 0 },
  } = data;

  if (isError) throw error;

  const countIsZero = count === 0; // Empty list signals missing Lightwell entitlement

  const {
    prefs,
    isError: isNotificationPrefsError,
    shouldExposeNotifications,
  } = useLightwellNotificationPrefs(!countIsZero);

  const {
    isRepoSubscribed,
    setRepoSubscribed,
    isLoading: isRepoNotificationsLoading,
    isError: isRepoNotificationsError,
    pendingEventType,
  } = useLightwellRepoNotifications(!countIsZero);

  const shouldShowNotificationButton = (shouldExposeNotifications && !countIsZero) || isDemo;
  const showNotificationsColumn = prefs?.enabled === true && !isRepoNotificationsLoading;

  const columnHeaders: {
    title: string;
    width?: BaseCellProps['width'];
    info?: ComponentProps<typeof Th>['info'];
  }[] = [
    { title: 'Repository' },
    { title: 'Ecosystem', width: 15 },
    { title: 'Security level', width: 15 },
    {
      title: 'Packages',
      width: 10,
      info: { tooltip: 'Unique package names available in this repository.' },
    },
    {
      title: 'Versions',
      width: 10,
      info: {
        tooltip: 'Total package versions available in this repository.',
      },
    },
    ...(showNotificationsColumn
      ? [
          {
            title: 'Email alerts',
            width: 10 as const,
            info: {
              tooltip: 'Receive email alerts when new packages are added to this repository.',
            },
          },
        ]
      : []),
  ];

  const onSetPage = (_, newPage: number) => setPage(newPage);

  const onPerPageSelect = (_, newPerPage: number, newPage: number) => {
    localStorage.setItem(lightwellReposPerPageKey, newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const paginationProps = {
    isDisabled: isLoading,
    itemCount: count,
    perPage,
    page,
    onSetPage,
    onPerPageSelect,
  };

  const handleNotificationToggle = (eventType: string, checked: boolean) =>
    // prefs! is safe: the toggle is only reachable when showNotificationsColumn (prefs.enabled === true)
    setRepoSubscribed(eventType, checked ? mapSeveritiesToApi(prefs!.minimumSeverity) : []);

  return (
    <>
      <LwPageHeader>
        <PageChromeSlots>
          <PageChromeSlot>
            <PageTitleStack
              title='Repositories'
              description='Connect to Lightwell repositories to access validated and remediated packages for your applications.'
              ouiaId='lightwell-header'
            />
            {shouldShowNotificationButton ? (
              <PageChromeSlotFooter>
                <LwButtonGroup>
                  <NotificationPreferencesModal>
                    <LwButton
                      variant='primary'
                      aria-label='Notification preferences'
                      ouiaId='lightwell-notification-preferences-button'
                      icon={<BellIcon />}
                      {...(!isDemo && { isDisabled: isNotificationPrefsError })}
                    >
                      Notifications
                    </LwButton>
                  </NotificationPreferencesModal>
                </LwButtonGroup>
              </PageChromeSlotFooter>
            ) : null}
          </PageChromeSlot>
        </PageChromeSlots>
      </LwPageHeader>
      <PageSection hasBodyWrapper={false} className={`${spacing.pt_0} ${spacing.pbLg}`}>
        <Grid data-ouia-component-id='lightwell-repositories-page'>
          <Hide hide={countIsZero || count < 10}>
            <Flex
              className={classes.topContainer}
              data-ouia-component-id='lightwell-repositories-toolbar'
            >
              <FlexItem align={{ default: 'alignRight' }}>
                <Pagination
                  id='lightwell-top-pagination'
                  widgetId='lightwellTopPaginationWidgetId'
                  isCompact
                  {...paginationProps}
                />
              </FlexItem>
            </Flex>
          </Hide>
          <Hide hide={!isLoading}>
            <Stack>
              <SkeletonTable
                rows={perPage}
                columnsCount={columnHeaders.length}
                variant={TableVariant.compact}
              />
            </Stack>
          </Hide>
          <Hide hide={countIsZero || isLoading}>
            <Stack>
              <LwCard className={`${spacing.ptLg} ${spacing.pb_2xl} ${spacing.pxLg}`}>
                <Stack>
                  <Table
                    aria-label='Lightwell repositories table'
                    ouiaId='lightwell-repositories-table'
                    isStriped
                  >
                    <Thead>
                      <Tr>
                        {columnHeaders.map(({ title, width, info }) => (
                          <Th key={title + 'column'} width={width} modifier='wrap' info={info}>
                            {info ? <span>{title}</span> : title}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {repositories.map((repo) => {
                        const {
                          uuid,
                          name,
                          content_type,
                          published_distribution_url,
                          security_level,
                          package_count,
                          version_count,
                        } = repo;

                        const eventType = getRepositoryPathSlug(content_type, security_level);

                        return (
                          <Tr key={uuid}>
                            <Td dataLabel={columnHeaders[0].title}>
                              <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
                                <Flex
                                  alignItems={{ default: 'alignItemsCenter' }}
                                  gap={{ default: 'gapSm' }}
                                >
                                  <Icon size='xl'>{getEcosystemIcon(content_type)}</Icon>
                                  <LwButton
                                    variant='link'
                                    isInline
                                    ouiaId={`lightwell-repo-${uuid}`}
                                    className={text.fontWeightBold}
                                    onClick={() =>
                                      navigateTo('repositoryPackages', {
                                        repoSlug: getSlugFromRepositoryName(name),
                                      })
                                    }
                                  >
                                    {formatRepositoryName(content_type, security_level, name)}
                                  </LwButton>
                                </Flex>
                                <FlexItem>
                                  <Content component='small'>
                                    {getRepositoryDescription(content_type, security_level)}
                                  </Content>
                                </FlexItem>
                                <FlexItem>
                                  <ConnectRepositoryModal
                                    repository={{
                                      uuid,
                                      name,
                                      published_distribution_url,
                                      content_type,
                                      security_level,
                                    }}
                                  >
                                    <Label
                                      isCompact
                                      isClickable
                                      icon={<CodeIcon />}
                                      variant='outline'
                                      color='blue'
                                    >
                                      {`Connect to ${formatRepositoryName(content_type, security_level, name)}`}
                                    </Label>
                                  </ConnectRepositoryModal>
                                </FlexItem>
                              </Flex>
                            </Td>
                            <Td dataLabel={columnHeaders[1].title}>
                              {getEcosystemFromContentType(content_type)}
                            </Td>
                            <Td dataLabel={columnHeaders[2].title}>
                              {security_level === 'validated' ? (
                                <Label variant='outline' color='purple'>
                                  {capitalize(security_level)}
                                </Label>
                              ) : security_level === 'remediated' ? (
                                <Label color='purple'>{capitalize(security_level)}</Label>
                              ) : security_level === 'predisclosure' ? (
                                <Label color='orange'>{capitalize(security_level)}</Label>
                              ) : (
                                '—'
                              )}
                            </Td>
                            <Td dataLabel={columnHeaders[3].title}>
                              {package_count.toLocaleString() ?? '0'}
                            </Td>
                            <Td dataLabel={columnHeaders[4].title}>
                              {version_count?.toLocaleString() ?? '0'}
                            </Td>
                            {showNotificationsColumn ? (
                              <Td>
                                {security_level === 'remediated' ||
                                security_level === 'predisclosure' ? (
                                  <Switch
                                    id={`notify-toggle-${uuid}`}
                                    aria-label={`Toggle notifications for ${name}`}
                                    isDisabled={
                                      isDemo ||
                                      isRepoNotificationsError ||
                                      pendingEventType === eventType
                                    }
                                    isChecked={isDemo ? true : isRepoSubscribed(eventType)}
                                    onChange={(_event, checked) =>
                                      handleNotificationToggle(eventType, checked)
                                    }
                                  />
                                ) : (
                                  'N/A'
                                )}
                              </Td>
                            ) : null}
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                  <Hide hide={countIsZero || count < 10}>
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
          <Hide hide={!countIsZero || isLoading}>
            <Stack>
              <EmptyTableState />
            </Stack>
          </Hide>
        </Grid>
      </PageSection>
    </>
  );
};

export default RepositoriesTable;
