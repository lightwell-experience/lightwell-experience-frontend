import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';

import PackageDetails from './PackageDetails';
import {
  useMavenPackageVersionsListQuery,
  usePythonPackageVersionsQuery,
} from 'services/Content/ContentQueries';
import {
  useAdvisoryDetailsQuery,
  usePackageAdvisoriesQuery,
} from 'services/Lightwell/AdvisoriesQueries';
import {
  defaultLightwellContentItem,
  defaultLightwellRepositoryPackageItem,
  defaultPythonPredisclosureContentItem,
  defaultPythonRemediatedContentItem,
  defaultPythonPackageVersions,
  defaultPythonRemediatedRepositoryPackageItem,
  defaultPythonValidatedContentItem,
  defaultPythonValidatedPackageItem,
  defaultPythonValidatedPackageVersions,
  gradleRemediatedDependencySnippet,
  gradleValidatedDependencySnippet,
  javaRemediatedCopyCommand,
  mavenRemediatedDependencySnippet,
  mavenValidatedDependencySnippet,
  pipConfValidatedInstallSnippet,
  pipValidatedInstallSnippet,
  ReactQueryTestWrapper,
  requirementsValidatedInstallSnippet,
  otherJavaRemediatedCopyCommand,
} from 'testingHelpers';
import { getRepositoryPathSlug } from '../helpers';
import { getMockAdvisoriesForLatestRelease } from '../mockAdvisories';
import useLightwellRepository from '../../../Hooks/Lightwell/useLightwellRepository';

jest.mock('services/Content/ContentQueries', () => ({
  useMavenPackageVersionsListQuery: jest.fn(),
  usePythonPackageVersionsQuery: jest.fn(),
}));

jest.mock('services/Lightwell/AdvisoriesQueries', () => ({
  usePackageAdvisoriesQuery: jest.fn(() => ({ isLoading: false, data: undefined })),
  useAdvisoryDetailsQuery: jest.fn(),
}));

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  LIGHTWELL_USE_MOCK: false,
}));

jest.mock('Hooks/Lightwell/useLightwellRepository');

const defaultRepoSlug = getRepositoryPathSlug(
  defaultLightwellContentItem.content_type,
  defaultLightwellContentItem.security_level,
);

const packageName = defaultLightwellRepositoryPackageItem.name;
const packageCoordinate = `${defaultLightwellRepositoryPackageItem.group}:${packageName}`;

const mockUseParams = jest.fn<
  Partial<{ repoName: string; group: string; packageName: string }>,
  []
>();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

jest.mock('Hooks/Lightwell/navigation/useLightwellRootPath', () => ({
  useLightwellRootPath: jest.fn(() => '/lightwell'),
}));

const mockUseRemoteHook = jest.fn();
jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: (...args: unknown[]) => mockUseRemoteHook(...args),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

const mockNavigateTo = jest.fn();
jest.mock('Hooks/Lightwell/navigation/useLightwellNavigateTo', () => ({
  useLightwellNavigateTo: jest.fn(() => ({ navigateTo: mockNavigateTo })),
}));

const defaultBuilds = [
  { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
];

type PackageMetadata = {
  summary?: string;
  license?: string;
  author?: string;
  project_url?: string;
};

const mockVersionsListQuery = (
  builds = defaultBuilds,
  metadata: PackageMetadata = {},
  version = '3.14.0',
) => ({
  isLoading: false,
  data: {
    group: defaultLightwellRepositoryPackageItem.group,
    name: defaultLightwellRepositoryPackageItem.name,
    versions: [
      {
        group: defaultLightwellRepositoryPackageItem.group,
        name: defaultLightwellRepositoryPackageItem.name,
        version,
        builds,
        ...metadata,
      },
    ],
  },
});

const renderPackageDetails = (search = '') =>
  render(
    <MemoryRouter initialEntries={[`/package${search}`]}>
      <ReactQueryTestWrapper>
        <PackageDetails />
      </ReactQueryTestWrapper>
    </MemoryRouter>,
  );

const threeLatestVersionBuilds = [
  { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
  { version: '3.14.0', release: 'rhlw-00002', created_at: '2026-07-02T00:00:00Z' },
  { version: '3.14.0', release: 'rhlw-00003', created_at: '2026-07-03T00:00:00Z' },
];

const expectFixSummary = async (text: string) =>
  expect((await screen.findByTestId('lightwell-package-fix-summary')).textContent).toBe(text);

const latestReleaseAdvisory = {
  advisory_name: 'CVE-2024-0001',
  severity: '8.5',
  severity_score: 8.5,
  package_name: packageCoordinate,
  package_version: '3.14.0',
  fixed_versions: ['3.14.0.rhlw-00001'],
};

const mockPackageAdvisoriesQuery = (
  advisories?: (typeof latestReleaseAdvisory)[],
  queryState: { isLoading?: boolean; isFetching?: boolean; isError?: boolean } = {},
) => {
  (usePackageAdvisoriesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    isError: false,
    ...queryState,
    data: advisories ? { data: advisories } : undefined,
  }));
};

const mockPackageAdvisoriesQueryByVersion = (
  advisoriesByVersion: Record<string, (typeof latestReleaseAdvisory)[]>,
) => {
  (usePackageAdvisoriesQuery as jest.Mock).mockImplementation(
    ({ package_version: packageVersion }: Parameters<typeof usePackageAdvisoriesQuery>[0]) => ({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { data: advisoriesByVersion[packageVersion ?? ''] ?? [] },
    }),
  );
};

const mockAdvisoryDetailsQuery = () => {
  const advisories = getMockAdvisoriesForLatestRelease();

  (useAdvisoryDetailsQuery as jest.Mock).mockImplementation((name?: string) => ({
    isLoading: false,
    data: name
      ? {
          data: advisories.filter((advisory) => advisory.advisory_name === name),
        }
      : undefined,
  }));
};

const setupRepository = (securityLevel: 'remediated' | 'predisclosure') => {
  const repository = {
    ...defaultLightwellContentItem,
    name: `lightwell/java/${securityLevel}`,
    published_distribution_url: `https://example.com/lightwell/java/${securityLevel}`,
    security_level: securityLevel,
  };

  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('maven', securityLevel),
    group: defaultLightwellRepositoryPackageItem.group,
    packageName,
  });

  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository,
    repoUUID: repository.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseParams.mockReturnValue({
    repoName: defaultRepoSlug,
    group: defaultLightwellRepositoryPackageItem.group,
    packageName,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultLightwellContentItem,
    repoUUID: defaultLightwellContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => mockVersionsListQuery());
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: undefined,
  }));
  mockPackageAdvisoriesQuery(); // Clear advisory data between tests
  mockAdvisoryDetailsQuery();
});

it('shows empty state when the package has no builds', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      group: defaultLightwellRepositoryPackageItem.group,
      name: defaultLightwellRepositoryPackageItem.name,
      versions: [],
    },
  }));

  renderPackageDetails();

  expect(await screen.findByRole('heading', { name: 'No package details' })).toBeInTheDocument();
  expect(await screen.findByText('No details available yet for this package.')).toBeInTheDocument();
});

const setupNoReleasePackage = () => {
  const data = {
    group: 'org.json.test',
    name: 'json-test',
    versions: [
      {
        group: 'org.json.test',
        name: 'json-test',
        version: '2.21.2',
        builds: [{ version: '2.21.2', release: '', created_at: '2026-07-01T00:00:00Z' }],
      },
      {
        group: 'org.json.test',
        name: 'json-test',
        version: '2.20.0',
        builds: [{ version: '2.20.0', release: '', created_at: '2026-06-15T00:00:00Z' }],
      },
      {
        group: 'org.json.test',
        name: 'json-test',
        version: '2.19.1',
        builds: [{ version: '2.19.1', release: '', created_at: '2026-06-01T00:00:00Z' }],
      },
    ],
  };

  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data,
  }));
};

const setupPythonRemediatedPackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'remediated'),
    packageName: defaultPythonRemediatedRepositoryPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonRemediatedContentItem,
    repoUUID: defaultPythonRemediatedContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonPackageVersions,
  }));
};

const setupPythonPredisclosurePackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'predisclosure'),
    packageName: defaultPythonRemediatedRepositoryPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonPredisclosureContentItem,
    repoUUID: defaultPythonPredisclosureContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonPackageVersions,
  }));
};

it('hides release tabs and fix summary when package has no release', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Overview')).toBeInTheDocument();
  expect(screen.queryByText('Releases')).not.toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Remediations' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('lightwell-package-fix-summary')).not.toBeInTheDocument();
});

it('renders package detail content with builds', async () => {
  renderPackageDetails();

  expect(
    await screen.findByRole('heading', {
      name: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
    }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Overview')).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Remediations' })).not.toBeInTheDocument();
  expect(await screen.findByText('About this package')).toBeInTheDocument();
  expect(await screen.findByText('How to use')).toBeInTheDocument();
});

it('shows an empty state when the package has no remediations', async () => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery([]);
  renderPackageDetails();

  const remediationsTab = await screen.findByRole('tab', { name: 'Remediations' });
  expect(remediationsTab).not.toBeDisabled();
  await userEvent.click(remediationsTab);

  expect(
    await screen.findByText('No remediations are available for this package version.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Search CVEs or releases' })).toBeDisabled();
});

it('keeps the remediations tab enabled when remediations fail to load', async () => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery(undefined, { isError: true });
  renderPackageDetails();
  expect(await screen.findByRole('tab', { name: 'Remediations' })).not.toBeDisabled();
});

it('opens the vulnerability details drawer from the remediations tab', async () => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery([latestReleaseAdvisory]);
  renderPackageDetails();

  await userEvent.click(await screen.findByRole('tab', { name: 'Remediations' }));
  await userEvent.click(await screen.findByRole('link', { name: 'CVE-2024-0001' }));

  expect(await screen.findByRole('heading', { name: 'CVE-2024-0001' })).toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: 'CVE-2024-0001' })).toBeInTheDocument();
  expect(screen.getByText(/Remediated across/)).toHaveTextContent(
    'Remediated across 2 packages, 2 upstream versions, in 1 ecosystem',
  );
  expect(screen.getByRole('tab', { name: 'Vulnerability remediations tab' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Vulnerability OSV tab' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Close drawer panel' }));
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: 'CVE-2024-0001' })).not.toBeInTheDocument(),
  );
});

it('opens the vulnerability details drawer from the name search param', async () => {
  renderPackageDetails('?name=CVE-2026-1234');

  expect(await screen.findByRole('heading', { name: 'CVE-2026-1234' })).toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: 'CVE-2026-1234' })).toBeInTheDocument();
  expect(screen.getByText(/Remediated across/)).toHaveTextContent(
    'Remediated across 6 packages, 18 upstream versions, in 2 ecosystems',
  );
});

it('renders sidebar metadata', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() =>
    mockVersionsListQuery(defaultBuilds, {
      summary: 'JSON library for Java',
      license: 'MIT',
      author: 'JSON.org',
      project_url: 'https://example.com/json-test',
    }),
  );

  renderPackageDetails();

  expect(await screen.findByText('Last updated')).toBeInTheDocument();
  expect(await screen.findByText('Group ID')).toBeInTheDocument();
  expect(await screen.findByText(defaultLightwellRepositoryPackageItem.group)).toBeInTheDocument();
  expect(await screen.findByText('Rebuilt by')).toBeInTheDocument();
  expect(await screen.findByText('Red Hat')).toBeInTheDocument();
  expect(await screen.findByText('JSON library for Java')).toBeInTheDocument();
  expect(await screen.findByText('License')).toBeInTheDocument();
  expect(await screen.findByText('MIT')).toBeInTheDocument();
  expect(screen.queryByText('show more')).not.toBeInTheDocument();
  expect(await screen.findByText('Original author')).toBeInTheDocument();
  expect(await screen.findByText('JSON.org')).toBeInTheDocument();
  expect(await screen.findByText('Project')).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Source' })).toHaveAttribute(
    'href',
    'https://example.com/json-test',
  );
});

it('shows fallback summary when maven package summary is unavailable', async () => {
  renderPackageDetails();

  expect(await screen.findByText('Package description not yet available.')).toBeInTheDocument();
  expect(screen.queryByText('License')).not.toBeInTheDocument();
  expect(screen.queryByText('Original author')).not.toBeInTheDocument();
});

it('shows Versions tab for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Versions')).toBeInTheDocument();
  expect(screen.queryByText('Releases')).not.toBeInTheDocument();
});

it('shows version selector dropdown for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  const toggle = await screen.findByRole('button', { name: '2.21.2' });
  expect(toggle).toBeInTheDocument();
  expect(toggle.classList.contains('pf-v6-c-menu-toggle')).toBe(true);

  await userEvent.click(toggle);

  const menuItems = await screen.findAllByRole('menuitem');
  expect(menuItems).toHaveLength(3);
});

it('shows non-release description text', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(
    await screen.findByText(/rebuilt from source by Red Hat with no modifications/),
  ).toBeInTheDocument();
});

it('shows upstream versions list in sidebar for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Upstream versions')).toBeInTheDocument();
  expect(await screen.findByText('2.21.2, 2.20.0, 2.19.1')).toBeInTheDocument();
});

const setupMultiVersionReleasePackage = (
  olderRelease = 'rhlw-00002',
  latestBuilds = [{ version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' }],
) => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      group: 'org.json.test',
      name: 'json-test',
      versions: [
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '3.14.0',
          builds: latestBuilds,
        },
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '2.12.0',
          builds: [
            { version: '2.12.0', release: olderRelease, created_at: '2026-06-18T00:00:00Z' },
          ],
        },
      ],
    },
  }));
};

it('shows unique fixes across all releases for the selected package version', async () => {
  setupRepository('remediated');
  const packageAdvisoriesForRemediationSummary = {
    '3.14.0': [
      {
        ...latestReleaseAdvisory,
        advisory_name: 'CVE-2024-0001',
        fixed_versions: ['3.14.0.rhlw-00001', '3.14.0.rhlw-00002'],
      },
      {
        ...latestReleaseAdvisory,
        advisory_name: 'CVE-2024-0001',
        fixed_versions: ['3.14.0.rhlw-00002'],
      },
      {
        ...latestReleaseAdvisory,
        advisory_name: 'CVE-2024-0002',
        fixed_versions: ['3.14.0.rhlw-00002', '3.14.0.rhlw-00003'],
      },
    ],
    '2.12.0': [
      {
        ...latestReleaseAdvisory,
        advisory_name: 'CVE-2024-0003',
        package_version: '2.12.0',
        fixed_versions: ['2.12.0.rhlw-00001'],
      },
    ],
  };

  setupMultiVersionReleasePackage('rhlw-00002', threeLatestVersionBuilds);
  mockPackageAdvisoriesQueryByVersion(packageAdvisoriesForRemediationSummary);

  renderPackageDetails();

  await expectFixSummary('2 fixes across 3 Lightwell releases');

  await userEvent.click(screen.getByRole('button', { name: '3.14.0' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '2.12.0' }));

  await expectFixSummary('1 fix across 1 Lightwell release');
  expect(usePackageAdvisoriesQuery).toHaveBeenCalledWith(
    expect.objectContaining({ package_version: '2.12.0' }),
    { enabled: true },
  );
});

it('shows zero fixes across multiple releases with no advisories', async () => {
  setupMultiVersionReleasePackage('rhlw-00002', threeLatestVersionBuilds);
  mockPackageAdvisoriesQuery([]);

  renderPackageDetails();

  const summary = await screen.findByTestId('lightwell-package-fix-summary');
  expect(summary).toHaveStyle({ visibility: 'hidden' });
  expect(summary).toHaveAttribute('aria-hidden', 'true');
  expect(summary.textContent).toBe('0 fixes across 3 Lightwell releases');
});

it.each([
  ['while loading', { isLoading: true }],
  ['after an error', { isError: true }],
])('hides zero summary counts %s', async (_scenario, queryState) => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery(undefined, queryState);

  renderPackageDetails();

  const summary = await screen.findByTestId('lightwell-package-fix-summary');
  expect(summary).toHaveStyle({ visibility: 'hidden' });
  expect(summary).toHaveAttribute('aria-hidden', 'true');
  expect(summary.textContent).toBe('0 fixes across 0 Lightwell releases');
});

it('hides remediations for a selected version without a release', async () => {
  setupRepository('remediated');
  setupMultiVersionReleasePackage('');
  renderPackageDetails();

  await userEvent.click(await screen.findByRole('tab', { name: 'Remediations' }));
  await userEvent.click(screen.getByRole('button', { name: '3.14.0' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '2.12.0' }));

  expect(screen.queryByRole('tab', { name: 'Remediations' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Versions' })).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true'),
  );
  expect(screen.getByText(/backported fixes for known vulnerabilities/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '2.12.0' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '3.14.0' }));
  expect(await screen.findByRole('tab', { name: 'Remediations' })).toBeInTheDocument();
});

it('shows Lightwell releases for the selected version on the Releases tab', async () => {
  setupMultiVersionReleasePackage();

  renderPackageDetails();

  await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));

  expect(await screen.findByText(/Releases for:/)).toBeInTheDocument();

  const releasesTable = screen.getByRole('grid', { name: 'Releases for 3.14.0' });
  const releaseRows = releasesTable.querySelectorAll('tbody tr');
  expect(releaseRows).toHaveLength(1);
  expect(releaseRows[0]).toHaveTextContent('3.14.0.rhlw-00001');
  expect(releaseRows[0]).toHaveTextContent('Latest');
  expect(screen.queryByText('2.12.0.rhlw-00002')).not.toBeInTheDocument();

  await userEvent.click(await screen.findByRole('button', { name: '3.14.0' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '2.12.0' }));

  expect(await screen.findByText(/Releases for:/)).toBeInTheDocument();

  const selectedVersionTable = screen.getByRole('grid', { name: 'Releases for 2.12.0' });
  const selectedVersionRows = selectedVersionTable.querySelectorAll('tbody tr');
  expect(selectedVersionRows).toHaveLength(1);
  expect(selectedVersionRows[0]).toHaveTextContent('2.12.0.rhlw-00002');
  expect(selectedVersionRows[0]).toHaveTextContent('Latest');
  expect(screen.queryByText('3.14.0.rhlw-00001')).not.toBeInTheDocument();
});

it('lists all Lightwell releases for the selected version from latest to oldest', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      group: 'org.json.test',
      name: 'json-test',
      versions: [
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '3.14.0',
          builds: [
            { version: '3.14.0', release: 'rhlw-00003', created_at: '2026-07-03T00:00:00Z' },
            { version: '3.14.0', release: 'rhlw-00002', created_at: '2026-07-02T00:00:00Z' },
            { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
          ],
        },
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '2.12.0',
          builds: [
            { version: '2.12.0', release: 'rhlw-00002', created_at: '2026-06-18T00:00:00Z' },
            { version: '2.12.0', release: 'rhlw-00001', created_at: '2026-06-17T00:00:00Z' },
          ],
        },
      ],
    },
  }));

  renderPackageDetails();

  await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));

  const releasesTable = await screen.findByRole('grid', { name: 'Releases for 3.14.0' });
  const releaseRows = releasesTable.querySelectorAll('tbody tr');
  expect(releaseRows).toHaveLength(3);
  expect(releaseRows[0]).toHaveTextContent('3.14.0.rhlw-00003');
  expect(releaseRows[0]).toHaveTextContent('Latest');
  expect(releaseRows[0]).toHaveTextContent('3 Jul 2026');
  expect(releaseRows[1]).toHaveTextContent('3.14.0.rhlw-00002');
  expect(releaseRows[1]).toHaveTextContent('2 Jul 2026');
  expect(releaseRows[1]).not.toHaveTextContent('Latest');
  expect(releaseRows[2]).toHaveTextContent('3.14.0.rhlw-00001');
  expect(releaseRows[2]).toHaveTextContent('1 Jul 2026');
  expect(screen.queryByText('2.12.0.rhlw-00002')).not.toBeInTheDocument();
});

it('shows latest release fixes for a remediated repository', async () => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery([latestReleaseAdvisory]);

  renderPackageDetails();

  expect(await screen.findByText('1 new backported fix in this release')).toBeInTheDocument();
  expect(screen.getByTestId('lightwell-fixes-card')).toBeInTheDocument();
  expect(usePackageAdvisoriesQuery).toHaveBeenCalledWith(expect.any(Object), { enabled: true });
});

it('shows a dependency-update description when the latest release has no fixes', async () => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery([]);

  renderPackageDetails();

  expect(
    await screen.findByRole('heading', { name: 'No new backported fixes in this release' }),
  ).toBeInTheDocument();
  expect(screen.queryByTestId('lightwell-fixes-card')).not.toBeInTheDocument();
  expect(
    screen.getByText('Released to support a dependency update with no new fixes included.'),
  ).toBeInTheDocument();
});

it('shows the dependency-update description when all latest-release advisories have no severity', async () => {
  setupRepository('remediated');
  mockPackageAdvisoriesQuery([{ ...latestReleaseAdvisory, severity: '0', severity_score: 0 }]);

  renderPackageDetails();

  expect(
    await screen.findByRole('heading', { name: 'No new backported fixes in this release' }),
  ).toBeInTheDocument();
  expect(screen.queryByTestId('lightwell-fixes-card')).not.toBeInTheDocument();
  expect(
    screen.getByText('Released to support a dependency update with no new fixes included.'),
  ).toBeInTheDocument();
});

it('hides latest release fixes for a predisclosure repository', async () => {
  setupRepository('predisclosure');
  mockPackageAdvisoriesQuery([latestReleaseAdvisory]);

  renderPackageDetails();

  expect(await screen.findByRole('heading', { name: 'About this package' })).toBeInTheDocument();
  expect(screen.queryByText(/new backported fixes in this release/)).not.toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Remediations' })).not.toBeInTheDocument();
  expect(usePackageAdvisoriesQuery).not.toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({ enabled: true }),
  );

  const summary = screen.getByTestId('lightwell-package-fix-summary');
  expect(summary).toHaveStyle({ visibility: 'hidden' });
  expect(summary).toHaveTextContent('0 fixes across 1 Lightwell release');
});

it('keeps loading while the repository lookup still has the previous repository', async () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('maven', 'predisclosure'),
    group: defaultLightwellRepositoryPackageItem.group,
    packageName,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: {
      ...defaultLightwellContentItem,
      name: 'lightwell/java/remediated',
      security_level: 'remediated',
    },
    repoUUID: defaultLightwellContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  mockPackageAdvisoriesQuery([latestReleaseAdvisory]);

  renderPackageDetails();

  expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Remediations' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('lightwell-package-fix-summary')).not.toBeInTheDocument();
  expect(usePackageAdvisoriesQuery).not.toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({ enabled: true }),
  );
});

it('shows version dropdown for multi-version release packages', async () => {
  setupMultiVersionReleasePackage();

  renderPackageDetails();

  const toggle = await screen.findByRole('button', { name: '3.14.0' });
  expect(toggle).toBeInTheDocument();

  await userEvent.click(toggle);

  const menuItems = await screen.findAllByRole('menuitem');
  expect(menuItems).toHaveLength(2);
});

it('shows how to use section for python package', async () => {
  setupPythonRemediatedPackage();

  renderPackageDetails();

  expect(
    await screen.findByRole('heading', { name: defaultPythonRemediatedRepositoryPackageItem.name }),
  ).toBeInTheDocument();
  expect(await screen.findByText('How to use')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Install' })).not.toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'pip' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'requirements.txt' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'pip.conf' })).toBeInTheDocument();
});

it('shows Python remediated releases and copies the published pip version', async () => {
  setupPythonRemediatedPackage();
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      name: 'requests',
      versions: [
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1+rhlw.1',
          last_updated: '2026-07-01T00:00:00Z',
          builds: [],
        },
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1+rhlw.2',
          last_updated: '2026-07-02T00:00:00Z',
          builds: [],
        },
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '2.9.0+rhlw.1',
          last_updated: '2026-06-01T00:00:00Z',
          builds: [],
        },
      ],
    },
  }));
  const writeText = mockClipboard();

  renderPackageDetails();

  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Versions' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Releases' }));
  const latestRelease = await screen.findAllByRole('button', { name: '3.0.1+rhlw.2' });
  await userEvent.click(latestRelease[0]);
  expect(writeText).toHaveBeenCalledWith('pip install requests==3.0.1+rhlw.2');

  await userEvent.click(screen.getByRole('button', { name: '3.0.1' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '2.9.0' }));
  expect(await screen.findByText(/Releases for:/)).toBeInTheDocument();
  const olderRelease = await screen.findAllByRole('button', { name: '2.9.0+rhlw.1' });
  await userEvent.click(olderRelease[0]);
  expect(writeText).toHaveBeenCalledWith('pip install requests==2.9.0+rhlw.1');
});

it('reads Python releases from builds grouped by upstream version', async () => {
  setupPythonRemediatedPackage();
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      name: 'requests',
      versions: [
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1',
          last_updated: '2020-01-01T00:00:00Z',
          builds: [
            { version: '3.0.1', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' },
            { version: '3.0.1', release: 'rhlw.2', created_at: '2026-07-02T00:00:00Z' },
          ],
        },
      ],
    },
  }));
  const writeText = mockClipboard();

  renderPackageDetails();

  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Versions' })).not.toBeInTheDocument();
  expect(await screen.findByText('Python HTTP library')).toBeInTheDocument();
  expect(await screen.findByText('Apache 2.0')).toBeInTheDocument();
  expect(await screen.findByText('Google')).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Source' })).toHaveAttribute(
    'href',
    'https://requests.readthedocs.io',
  );

  await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('requests==3.0.1+rhlw.2'));

  await userEvent.click(screen.getByRole('tab', { name: 'Releases' }));
  expect(await screen.findByText('2 Jul 2026')).toBeInTheDocument();
  expect(screen.getByText('1 Jul 2026')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '3.0.1.rhlw.2' })).not.toBeInTheDocument();
  const latestRelease = await screen.findAllByRole('button', { name: '3.0.1+rhlw.2' });
  await userEvent.click(latestRelease[0]);
  expect(writeText).toHaveBeenCalledWith('pip install requests==3.0.1+rhlw.2');
  expect(screen.getAllByRole('button', { name: '3.0.1+rhlw.1' }).length).toBeGreaterThan(0);
});

it('uses the newest Python build date for last updated, including a build without a release', async () => {
  setupPythonRemediatedPackage();
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      name: 'requests',
      versions: [
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1',
          builds: [
            { version: '3.0.1', release: 'rhlw.2', created_at: '2026-07-02T00:00:00Z' },
            { version: '3.0.1', release: '', created_at: '2026-08-03T00:00:00Z' },
          ],
        },
      ],
    },
  }));

  renderPackageDetails();

  expect(await screen.findByText('Last updated')).toBeInTheDocument();
  expect(document.querySelector('time[datetime="2026-08-03T00:00:00.000Z"]')).toBeInTheDocument();
});

it('shows the Releases tab and hides Remediations for a python predisclosure package', async () => {
  setupPythonPredisclosurePackage();
  // Predisclosure packages still publish Lightwell releases, but advisory remediations
  // stay hidden until that data is shown for these repositories.
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      name: 'requests',
      versions: [
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1+rhlw.1',
          last_updated: '2026-07-01T00:00:00Z',
          builds: [],
        },
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1+rhlw.2',
          last_updated: '2026-07-02T00:00:00Z',
          builds: [],
        },
      ],
    },
  }));

  renderPackageDetails();

  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Remediations' })).not.toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Versions' })).not.toBeInTheDocument();
});

const mockClipboard = () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  return writeText;
};

const assertClipboardCopy = async (
  writeText: jest.Mock,
  click: () => Promise<void>,
  expected: string,
) => {
  writeText.mockClear();
  await click();
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(expected);
};

it('copies maven coordinate to clipboard for remediated java package', async () => {
  const writeText = mockClipboard();

  setupMultiVersionReleasePackage();
  renderPackageDetails();

  // Maven tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    mavenRemediatedDependencySnippet,
  );

  // Gradle tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Gradle' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    gradleRemediatedDependencySnippet,
  );

  // "Releases for version x.x.x" section of Releases tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));
      await userEvent.click(await screen.findByRole('button', { name: '3.14.0.rhlw-00001' }));
    },
    javaRemediatedCopyCommand,
  );

  // Releases for a different selected version
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: '3.14.0' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: '2.12.0' }));
      await userEvent.click(await screen.findByRole('button', { name: '2.12.0.rhlw-00002' }));
    },
    otherJavaRemediatedCopyCommand,
  );
});

const setupPythonValidatedPackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'validated'),
    packageName: defaultPythonValidatedPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonValidatedContentItem,
    repoUUID: defaultPythonValidatedContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonValidatedPackageVersions,
  }));
};

it('copies pip command to clipboard for validated python package', async () => {
  const writeText = mockClipboard();

  setupPythonValidatedPackage();
  renderPackageDetails();

  // pip tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipValidatedInstallSnippet,
  );

  // requirements.txt tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'requirements.txt' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    requirementsValidatedInstallSnippet,
  );

  // pip.conf tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'pip.conf' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipConfValidatedInstallSnippet,
  );
});

it('copies maven coordinate to clipboard for validated java package', async () => {
  const writeText = mockClipboard();

  setupNoReleasePackage();
  renderPackageDetails();

  // Maven tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    mavenValidatedDependencySnippet,
  );

  // Gradle tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Gradle' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    gradleValidatedDependencySnippet,
  );
});

it('registers breadcrumbs with Chrome via useRemoteHook', async () => {
  renderPackageDetails();

  await screen.findByRole('heading', {
    name: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
  });

  expect(mockUseRemoteHook).toHaveBeenCalledWith({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: [
      [
        { pathname: '/lightwell', title: 'Lightwell Repositories' },
        { pathname: `/lightwell/${defaultRepoSlug}`, title: 'Java Validated' },
        {
          pathname: `/lightwell/${defaultRepoSlug}/${encodeURIComponent(defaultLightwellRepositoryPackageItem.group)}/${encodeURIComponent(packageName)}`,
          title: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
        },
      ],
      { dropLastChromeSegment: true },
    ],
  });
});

it('returns to the packages list with the selected sort', async () => {
  (useFlag as jest.Mock).mockReturnValue(false);
  renderPackageDetails('?search=json&sort_by=name:asc&page=2');

  await userEvent.click(await screen.findByRole('button', { name: 'Java Validated' }));

  expect(mockNavigateTo).toHaveBeenCalledWith('repositoryPackages', {
    repoSlug: defaultRepoSlug,
    packagesParams: {
      search: 'json',
      page: 2,
      sortBy: 'name',
      sortDirection: 'asc',
    },
  });

  (useFlag as jest.Mock).mockReturnValue(true);
});

it('keeps the selected sort on the repository breadcrumb', async () => {
  renderPackageDetails('?sort_by=name:asc&page=2');

  await screen.findByRole('heading', {
    name: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
  });

  expect(mockUseRemoteHook).toHaveBeenCalledWith({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: [
      expect.arrayContaining([
        {
          pathname: `/lightwell/${defaultRepoSlug}?sort_by=name%3Aasc&page=2`,
          title: 'Java Validated',
        },
      ]),
      { dropLastChromeSegment: true },
    ],
  });
});
