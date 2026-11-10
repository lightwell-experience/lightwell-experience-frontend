import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RepositoriesTable from './RepositoriesTable';
import { useContentListQuery } from 'services/Content/ContentQueries';
import {
  defaultLightwellContentItem,
  defaultPythonPredisclosureContentItem,
  defaultPythonRemediatedContentItem,
  defaultPythonValidatedContentItem,
  ReactQueryTestWrapper,
} from 'testingHelpers';
import { ContentItem } from 'services/Content/ContentApi';
import { getSlugFromRepositoryName } from '../helpers';
import { useLightwellNotificationPrefs } from './hooks/useLightwellNotificationPrefs';
import { useLightwellNavigateTo } from '../../../Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { useLightwellRepoNotifications } from './hooks/useLightwellRepoNotifications';

const mockUseRemoteHook = jest.fn();

jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: (...args: unknown[]) => mockUseRemoteHook(...args),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

jest.mock('services/Content/ContentQueries', () => ({
  useContentListQuery: jest.fn(),
  useLightwellRepositoryPackageCountsQuery: jest.fn(),
}));

const mockNavigateTo = jest.fn();

jest.mock('Hooks/Lightwell/navigation/useLightwellNavigateTo', () => ({
  useLightwellNavigateTo: jest.fn(),
}));

jest.mock('Hooks/Lightwell/navigation/useLightwellRootPath', () => ({
  useLightwellRootPath: jest.fn(() => '/lightwell'),
}));

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  LIGHTWELL_USE_MOCK: false,
}));

jest.mock('./hooks/useLightwellNotificationPrefs', () => ({
  useLightwellNotificationPrefs: jest.fn(),
}));

jest.mock('./hooks/useLightwellRepoNotifications', () => ({
  ...jest.requireActual('./hooks/useLightwellRepoNotifications'),
  useLightwellRepoNotifications: jest.fn(),
}));

const javaRemediatedContentItem: ContentItem = {
  ...defaultLightwellContentItem,
  name: 'lightwell/java/remediated',
  published_distribution_url: 'https://example.com/lightwell/java/remediated',
  uuid: '3875c35b-a67a-4ac2-a989-21139433c178',
  security_level: 'remediated',
  package_count: 11,
  build_count: 28,
  version_count: 28,
};

const javaPredisclosureContentItem: ContentItem = {
  ...defaultLightwellContentItem,
  name: 'lightwell/java/predisclosure',
  published_distribution_url: 'https://example.com/lightwell/java/predisclosure',
  uuid: '3875c35b-a67a-4ac2-a989-21139433c179',
  security_level: 'predisclosure',
  package_count: 8,
  build_count: 18,
  version_count: 18,
};

const npmValidatedContentItem: ContentItem = {
  ...defaultLightwellContentItem,
  name: 'lightwell/npm/validated',
  published_distribution_url: 'https://example.com/lightwell/npm/validated',
  uuid: '3875c35b-a67a-4ac2-a989-21139433c180',
  content_type: 'npm',
};

const renderRepositoriesTable = () =>
  render(
    <ReactQueryTestWrapper>
      <RepositoriesTable />
    </ReactQueryTestWrapper>,
  );

beforeEach(() => {
  (useLightwellNavigateTo as jest.Mock).mockReturnValue({
    navigateTo: mockNavigateTo,
  });
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: undefined,
    isLoading: false,
    isError: false,
    shouldExposeNotifications: false,
  });
  (useLightwellRepoNotifications as jest.Mock).mockReturnValue({
    isRepoSubscribed: jest.fn().mockReturnValue(false),
    setRepoSubscribed: jest.fn(),
    isLoading: false,
    isError: false,
    pendingEventType: undefined,
  });
});

it('shows empty state when there are no repositories', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({ isLoading: false }));

  renderRepositoriesTable();

  expect(await screen.findByText('Lightwell members only')).toBeInTheDocument();
});

it('renders with a single repository', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Java Validated')).toBeInTheDocument();
  expect(
    await screen.findByText(
      'Maven artifacts rebuilt from source by Red Hat. Verified end-to-end with no modifications.',
    ),
  ).toBeInTheDocument();
  expect(await screen.findByText('Java')).toBeInTheDocument();
  expect(await screen.findByText('1')).toBeInTheDocument();
  expect(await screen.findByText('3')).toBeInTheDocument();
});

it('shows a loading skeleton while repositories are loading', () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({ isLoading: true }));

  renderRepositoriesTable();

  expect(
    screen.getByText(
      'Connect to Lightwell repositories to access validated and remediated packages for your applications.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: 'Lightwell repositories table' }),
  ).not.toBeInTheDocument();
});

it('navigates to repository packages when a repository name is clicked', async () => {
  const user = userEvent.setup();
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  await user.click(await screen.findByRole('button', { name: 'Java Validated' }));

  expect(mockNavigateTo).toHaveBeenCalledWith('repositoryPackages', {
    repoSlug: getSlugFromRepositoryName(defaultLightwellContentItem.name),
  });
});

it('renders java remediated repository with remediated description', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [javaRemediatedContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Java Remediated')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Maven artifacts with Red Hat backported fixes for known vulnerabilities in pinned versions.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('11')).toBeInTheDocument();
  expect(screen.getByText('28')).toBeInTheDocument();
});

it('renders python validated repository with python ecosystem label', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultPythonValidatedContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Python Validated')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Python wheels rebuilt from source by Red Hat. Verified end-to-end with no modifications.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('Python')).toBeInTheDocument();
});

it('shows a Technology Preview label only on JavaScript repositories', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [
        defaultLightwellContentItem,
        defaultPythonValidatedContentItem,
        npmValidatedContentItem,
      ],
      meta: { count: 3, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  const npmRow = (await screen.findByRole('button', { name: 'JavaScript Validated' })).closest(
    'tr',
  ) as HTMLElement;
  expect(within(npmRow).getByText('Technology Preview')).toBeInTheDocument();

  const javaRow = screen.getByText('Java Validated').closest('tr') as HTMLElement;
  const pythonRow = screen.getByText('Python Validated').closest('tr') as HTMLElement;
  expect(within(javaRow).queryByText('Technology Preview')).not.toBeInTheDocument();
  expect(within(pythonRow).queryByText('Technology Preview')).not.toBeInTheDocument();
});

it('opens the Technology Preview popover when the label is clicked', async () => {
  const user = userEvent.setup();
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [npmValidatedContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  await user.click(await screen.findByRole('button', { name: 'Technology Preview' }));

  expect(await screen.findByText('Technology Preview repository')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Some packages may be removed or rebuilt. More packages will be added over time.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
    'href',
    'https://access.redhat.com/support/offerings/techpreview',
  );
});

it('renders connect action for each repository', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Connect to Java Validated')).toBeInTheDocument();
});

it('renders validated and remediated security level labels', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem, defaultPythonRemediatedContentItem],
      meta: { count: 2, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Validated')).toBeInTheDocument();
  expect(screen.getByText('Remediated')).toBeInTheDocument();
});

it('renders repository table column headers', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByRole('columnheader', { name: 'Repository' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Ecosystem' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Security level' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Packages' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Versions' })).toBeInTheDocument();
});

it('hides notification features when the feature flag is off', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Java Validated')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Notification preferences' }),
  ).not.toBeInTheDocument();
});

it('shows notification column and modal when user has stored notification preferences', async () => {
  const user = userEvent.setup();
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'critical' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByRole('columnheader', { name: 'Email alerts' })).toBeInTheDocument();
  expect(screen.getByText('N/A')).toBeInTheDocument();

  const notificationsButton = screen.getByRole('button', { name: 'Notification preferences' });
  expect(notificationsButton).toBeEnabled();

  await user.click(notificationsButton);

  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });

  await waitFor(() => {
    expect(within(modal).getByRole('switch', { name: 'Email notifications' })).toBeChecked();
    expect(within(modal).getByRole('radio', { name: 'Critical' })).toBeChecked();
  });
});

it('disables notification features when preferences fail to load', async () => {
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: undefined,
    isLoading: false,
    isError: true,
    shouldExposeNotifications: true,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByRole('button', { name: 'Notification preferences' })).toBeDisabled();
  expect(screen.queryByRole('columnheader', { name: 'Email alerts' })).not.toBeInTheDocument();
});

it('unsubscribes from repository notifications when toggle is turned off', async () => {
  const user = userEvent.setup();
  const mockSetRepoSubscribed = jest.fn();
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'critical' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useLightwellRepoNotifications as jest.Mock).mockReturnValue({
    isRepoSubscribed: jest.fn().mockReturnValue(true),
    setRepoSubscribed: mockSetRepoSubscribed,
    isLoading: false,
    isError: false,
    pendingEventType: undefined,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [javaRemediatedContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  const toggle = await screen.findByRole('switch', {
    name: `Toggle notifications for ${javaRemediatedContentItem.name}`,
  });
  expect(toggle).toBeChecked();

  await user.click(toggle);
  expect(mockSetRepoSubscribed).toHaveBeenCalledWith('java-remediated', []);
});

it('renders java predisclosure repository', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [javaPredisclosureContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Java Predisclosure')).toBeInTheDocument();
  expect(screen.getByText('Predisclosure')).toBeInTheDocument();
});

it('shows notification toggle for predisclosure repositories', async () => {
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'critical' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [javaPredisclosureContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  await screen.findByText('Java Predisclosure');

  expect(
    screen.getByRole('switch', {
      name: `Toggle notifications for ${javaPredisclosureContentItem.name}`,
    }),
  ).toBeInTheDocument();
});

it('subscribes to predisclosure repository notifications when toggle is turned on', async () => {
  const user = userEvent.setup();
  const mockSetRepoSubscribed = jest.fn();
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'high' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useLightwellRepoNotifications as jest.Mock).mockReturnValue({
    isRepoSubscribed: jest.fn().mockReturnValue(false),
    setRepoSubscribed: mockSetRepoSubscribed,
    isLoading: false,
    isError: false,
    pendingEventType: undefined,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [javaPredisclosureContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  const toggle = await screen.findByRole('switch', {
    name: `Toggle notifications for ${javaPredisclosureContentItem.name}`,
  });
  expect(toggle).not.toBeChecked();

  await user.click(toggle);
  expect(mockSetRepoSubscribed).toHaveBeenCalledWith('java-predisclosure', [
    'critical',
    'important',
  ]);
});

it('shows notification toggle for python remediated repositories', async () => {
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'critical' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultPythonRemediatedContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  await screen.findByText('Python Remediated');

  expect(
    screen.getByRole('switch', {
      name: `Toggle notifications for ${defaultPythonRemediatedContentItem.name}`,
    }),
  ).toBeInTheDocument();
});

it('subscribes to python remediated repository notifications when toggle is turned on', async () => {
  const user = userEvent.setup();
  const mockSetRepoSubscribed = jest.fn();
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'high' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useLightwellRepoNotifications as jest.Mock).mockReturnValue({
    isRepoSubscribed: jest.fn().mockReturnValue(false),
    setRepoSubscribed: mockSetRepoSubscribed,
    isLoading: false,
    isError: false,
    pendingEventType: undefined,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultPythonRemediatedContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  const toggle = await screen.findByRole('switch', {
    name: `Toggle notifications for ${defaultPythonRemediatedContentItem.name}`,
  });
  expect(toggle).not.toBeChecked();

  await user.click(toggle);
  expect(mockSetRepoSubscribed).toHaveBeenCalledWith('python-remediated', [
    'critical',
    'important',
  ]);
});

it('renders python predisclosure repository', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultPythonPredisclosureContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText('Python Predisclosure')).toBeInTheDocument();
  expect(screen.getByText('Predisclosure')).toBeInTheDocument();
});

it('subscribes to python predisclosure repository notifications when toggle is turned on', async () => {
  const user = userEvent.setup();
  const mockSetRepoSubscribed = jest.fn();
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'high' },
    isLoading: false,
    isError: false,
    shouldExposeNotifications: true,
  });
  (useLightwellRepoNotifications as jest.Mock).mockReturnValue({
    isRepoSubscribed: jest.fn().mockReturnValue(false),
    setRepoSubscribed: mockSetRepoSubscribed,
    isLoading: false,
    isError: false,
    pendingEventType: undefined,
  });
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultPythonPredisclosureContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  const toggle = await screen.findByRole('switch', {
    name: `Toggle notifications for ${defaultPythonPredisclosureContentItem.name}`,
  });
  expect(toggle).not.toBeChecked();

  await user.click(toggle);
  expect(mockSetRepoSubscribed).toHaveBeenCalledWith('python-predisclosure', [
    'critical',
    'important',
  ]);
});

it('registers breadcrumbs with Chrome via useRemoteHook', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  await screen.findByText('Java Validated');

  expect(mockUseRemoteHook).toHaveBeenCalledWith({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: [
      expect.arrayContaining([expect.objectContaining({ title: 'Lightwell Repositories' })]),
      { dropLastChromeSegment: true },
    ],
  });
});

it('shows JavaScript Validated and navigates to its packages', async () => {
  (useContentListQuery as jest.Mock).mockReturnValue({
    data: {
      data: [
        {
          ...defaultLightwellContentItem,
          name: 'lightwell/javascript/validated',
          content_type: 'npm',
          security_level: 'validated',
        },
      ],
      meta: { count: 1 },
    },
  });
  renderRepositoriesTable();
  await userEvent.click(await screen.findByRole('button', { name: 'JavaScript Validated' }));
  expect(mockNavigateTo).toHaveBeenCalledWith(
    'repositoryPackages',
    expect.objectContaining({ repoSlug: 'javascript-validated' }),
  );
});

it('orders ecosystems Java, Python, JavaScript and tiers within each', async () => {
  const repo = (content_type: string, ecosystem: string, security_level: string) => ({
    ...defaultLightwellContentItem,
    uuid: `${ecosystem}-${security_level}`,
    content_type,
    security_level,
    name: `lightwell/${ecosystem}/${security_level}`,
  });
  (useContentListQuery as jest.Mock).mockReturnValue({
    data: {
      // The backend serves JavaScript validated only, so no other npm tier appears here.
      data: [
        repo('npm', 'javascript', 'validated'),
        repo('python', 'python', 'remediated'),
        repo('maven', 'java', 'remediated'),
        repo('python', 'python', 'validated'),
        repo('python', 'python', 'predisclosure'),
        repo('maven', 'java', 'predisclosure'),
        repo('maven', 'java', 'validated'),
      ],
      meta: { count: 7 },
    },
  });
  renderRepositoriesTable();
  const table = await screen.findByRole('grid', { name: 'Lightwell repositories table' });
  // "JavaScript ..." also matches /^Java/, so the filter keeps all three ecosystems.
  const names = within(table)
    .getAllByRole('button')
    .map((button) => button.textContent)
    .filter((name) => /^(Java|Python)/.test(name ?? ''));
  expect(names).toEqual([
    'Java Predisclosure',
    'Java Remediated',
    'Java Validated',
    'Python Predisclosure',
    'Python Remediated',
    'Python Validated',
    'JavaScript Validated',
  ]);
});
