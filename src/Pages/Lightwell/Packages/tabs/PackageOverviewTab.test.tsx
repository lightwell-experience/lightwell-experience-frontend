import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import PackageOverviewTab from './PackageOverviewTab';
import * as useLatestReleaseFixesModule from '../hooks/useLatestReleaseFixes';

// Mock the dependencies
jest.mock('../../Repositories/components/ConnectRepositoryModal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../components/LatestReleaseFixes', () => ({
  __esModule: true,
  default: ({ total, counts }: { total: number; counts: Record<string, number> }) => (
    <div data-ouia-component-id='latest-release-fixes'>
      <span>Total fixes: {total}</span>
      <span>Critical: {counts.Critical}</span>
      <span>Important: {counts.Important}</span>
    </div>
  ),
}));

const mockUseLatestReleaseFixes = jest.spyOn(
  useLatestReleaseFixesModule,
  'useLatestReleaseFixes',
) as unknown as jest.Mock;

const defaultMavenProps = {
  isMaven: true,
  group: 'org.json',
  name: 'json',
  latestRelease: '20230227.rhlw-00001',
  packageVersion: '20230227',
  hasRelease: true,
  summary: 'A reference implementation of a JSON package in Java.',
  sourceUrl: 'https://example.com/maven-repo',
  repository: {
    uuid: 'repo-uuid-123',
    name: 'java-remediated',
    published_distribution_url: 'https://example.com/maven-repo',
    content_type: 'maven',
    security_level: 'remediated' as const,
  },
};

const defaultPythonProps = {
  isMaven: false,
  group: '',
  name: 'requests',
  latestRelease: '2.31.0+rhlw-00001',
  packageVersion: '2.31.0',
  hasRelease: true,
  summary: 'Python HTTP for Humans.',
  sourceUrl: 'https://example.com/python-repo',
  repository: {
    uuid: 'repo-uuid-456',
    name: 'python-remediated',
    published_distribution_url: 'https://example.com/python-repo',
    content_type: 'python',
    security_level: 'remediated' as const,
  },
};

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
  jest.clearAllMocks();

  // Default mock implementation
  mockUseLatestReleaseFixes.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
  });
});

describe('PackageOverviewTab', () => {
  it('should render package summary when provided', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText('About this package')).toBeInTheDocument();
    expect(
      screen.getByText('A reference implementation of a JSON package in Java.'),
    ).toBeInTheDocument();
  });

  it('should display default message when summary is not available', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} summary={undefined} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Package description not yet available.')).toBeInTheDocument();
  });

  it('should render backported-fix description for remediated packages', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/This package has been rebuilt by Red Hat with backported fixes/),
    ).toBeInTheDocument();
    expect(screen.getByText(/\.rhlw suffix\)\./)).toBeInTheDocument();
  });

  it('should render predisclosure description for predisclosure packages', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab
          {...defaultMavenProps}
          repository={{ ...defaultMavenProps.repository, security_level: 'predisclosure' }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/backported fixes for vulnerabilities not yet publicly disclosed/),
    ).toBeInTheDocument();
    expect(screen.getByText(/\.rhlw suffix\)\./)).toBeInTheDocument();
  });

  it('should render rebuilt-from-source description for validated packages', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab
          {...defaultMavenProps}
          hasRelease={false}
          repository={{ ...defaultMavenProps.repository, security_level: 'validated' }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /This package has been rebuilt from source by Red Hat with no modifications/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Multiple upstream versions are available/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'configure your build tool (Maven, Gradle, Artifactory, or Nexus)',
      }),
    ).toBeInTheDocument();
  });

  it('should not render a package description when security level is unknown', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} repository={undefined} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/This package has been rebuilt/)).not.toBeInTheDocument();
  });

  it('should display latest release fixes for remediated repositories with security_level="remediated"', () => {
    mockUseLatestReleaseFixes.mockReturnValue({
      data: {
        total: 5,
        counts: {
          Critical: 2,
          Important: 3,
          Moderate: 0,
          Low: 0,
          None: 0,
        },
      },
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    const fixesCard = screen.getByTestId('latest-release-fixes');
    expect(fixesCard).toBeInTheDocument();
    expect(within(fixesCard).getByText('Total fixes: 5')).toBeInTheDocument();
    expect(within(fixesCard).getByText('Critical: 2')).toBeInTheDocument();
    expect(within(fixesCard).getByText('Important: 3')).toBeInTheDocument();
  });

  it('should not display latest release fixes for non-remediated repositories', () => {
    mockUseLatestReleaseFixes.mockReturnValue({
      data: {
        total: 5,
        counts: {
          Critical: 2,
          Important: 3,
          Moderate: 0,
          Low: 0,
          None: 0,
        },
      },
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <PackageOverviewTab
          {...defaultMavenProps}
          repository={{
            ...defaultMavenProps.repository,
            security_level: undefined,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('latest-release-fixes')).not.toBeInTheDocument();
  });

  it('should show loading skeleton while fetching advisories', () => {
    mockUseLatestReleaseFixes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
    });

    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading package advisories')).toBeInTheDocument();
  });

  it('should render Maven dependency snippets for Maven packages', async () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText('How to use')).toBeInTheDocument();

    // Check for Maven tab
    const mavenTab = screen.getByRole('tab', { name: 'Maven' });
    expect(mavenTab).toBeInTheDocument();

    // Check for Gradle tab
    const gradleTab = screen.getByRole('tab', { name: 'Gradle' });
    expect(gradleTab).toBeInTheDocument();

    // Maven snippet should be visible by default
    expect(screen.getByText(/Add to your pom.xml:/)).toBeInTheDocument();
    expect(screen.getByText(/<groupId>org.json<\/groupId>/)).toBeInTheDocument();
    expect(screen.getByText(/<artifactId>json<\/artifactId>/)).toBeInTheDocument();

    // Switch to Gradle tab
    await user.click(gradleTab);
    expect(screen.getByText(/Add to your build.gradle:/)).toBeInTheDocument();
    expect(
      screen.getByText(/implementation\("org.json:json:20230227.rhlw-00001"\)/),
    ).toBeInTheDocument();
  });

  it('should render Python dependency snippets for Python packages', async () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultPythonProps} />
      </MemoryRouter>,
    );

    // Check for pip tab
    const pipTab = screen.getByRole('tab', { name: 'pip' });
    expect(pipTab).toBeInTheDocument();

    const uvTab = screen.getByRole('tab', { name: 'uv' });
    expect(uvTab).toBeInTheDocument();

    // Check for requirements.txt tab
    const requirementsTab = screen.getByRole('tab', { name: 'requirements.txt' });
    expect(requirementsTab).toBeInTheDocument();

    // Check for pip.conf tab
    const pipConfTab = screen.getByRole('tab', { name: 'pip.conf' });
    expect(pipConfTab).toBeInTheDocument();

    // pip snippet should be visible by default. All tab panels render at once (inactive ones
    // hidden), so scope content assertions to the active panel to avoid cross-panel matches.
    expect(screen.getByText(/Install directly:/)).toBeInTheDocument();
    const pipPanel = screen.getByRole('tabpanel');
    expect(
      within(pipPanel).getByText(/pip install --index-url .*requests==2.31.0\+rhlw-00001/),
    ).toBeInTheDocument();

    // Switch to requirements.txt tab
    await user.click(requirementsTab);
    expect(screen.getByText(/Add to your requirements.txt:/)).toBeInTheDocument();
    const requirementsPanel = screen.getByRole('tabpanel');
    expect(
      within(requirementsPanel).getByText(
        /--index-url https:\/\/example.com\/python-repo\/simple\s+requests==/,
      ),
    ).toBeInTheDocument();

    await user.click(uvTab);
    expect(screen.getByText(/Install with uv:/)).toBeInTheDocument();
    const uvPanel = screen.getByRole('tabpanel');
    expect(
      within(uvPanel).getByText(
        /uv pip install --system-certs --index-url .*requests==2\.31\.0\+rhlw-00001/,
      ),
    ).toBeInTheDocument();
  });

  it('should render ConnectRepositoryModal button when repository is provided', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    const connectButton = screen.getByRole('button', {
      name: 'configure your build tool (Maven, Gradle, Artifactory, Nexus, or Renovate)',
    });
    expect(connectButton).toBeInTheDocument();
  });

  it('should render static text when repository is not provided', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} repository={undefined} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /First, configure your build tool \(Maven, Gradle, Artifactory, or Nexus\) to use this repository\./,
      ),
    ).toBeInTheDocument();

    // Should not have a button
    expect(
      screen.queryByRole('button', {
        name: 'configure your build tool (Maven, Gradle, Artifactory, or Nexus)',
      }),
    ).not.toBeInTheDocument();
  });

  it('should render Python-specific build tool text for Python packages', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultPythonProps} />
      </MemoryRouter>,
    );

    const connectButton = screen.getByRole('button', {
      name: 'configure your build tool (pip, Pipenv, Poetry, uv, Artifactory, or Nexus)',
    });
    expect(connectButton).toBeInTheDocument();
  });

  it('should render +rhlw suffix description for Python remediated packages', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultPythonProps} hasRelease={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/\+rhlw suffix\)\./)).toBeInTheDocument();
  });

  it('should not call useLatestReleaseFixes when hasRelease is false', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} hasRelease={false} />
      </MemoryRouter>,
    );

    expect(mockUseLatestReleaseFixes).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should call useLatestReleaseFixes with correct parameters for remediated packages', () => {
    render(
      <MemoryRouter>
        <PackageOverviewTab {...defaultMavenProps} />
      </MemoryRouter>,
    );

    expect(mockUseLatestReleaseFixes).toHaveBeenCalledWith({
      repository: 'java-remediated',
      packageName: 'org.json:json',
      packageVersion: '20230227',
      enabled: true,
    });
  });
});
