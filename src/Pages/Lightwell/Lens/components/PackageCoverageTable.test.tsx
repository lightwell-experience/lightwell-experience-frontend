import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PackageCoverageTable from './PackageCoverageTable';
import { usePackageCoverageTable } from '../hooks/usePackageCoverageTable';
import { useCoverageReportPackagesQuery } from 'services/Lightwell/CoverageReportsQueries';
import { defaultCoverageReportPackagesItem, ReactQueryTestWrapper } from 'testingHelpers';
import type { EcosystemInfo } from '../utils/ecosystem';

jest.mock('services/Lightwell/CoverageReportsQueries', () => ({
  ...jest.requireActual('services/Lightwell/CoverageReportsQueries'),
  useCoverageReportPackagesQuery: jest.fn(),
}));

jest.mock('Pages/Lightwell/constants', () => ({
  ...jest.requireActual('Pages/Lightwell/constants'),
  LIGHTWELL_LENS_USE_MOCK: false,
}));

const PackageCoverageTableHarness = ({
  ecosystems,
  showCveColumns = true,
}: {
  ecosystems: EcosystemInfo[];
  showCveColumns?: boolean;
}) => {
  const table = usePackageCoverageTable(ecosystems);
  return (
    <PackageCoverageTable
      uuid='test-uuid'
      ecosystems={ecosystems}
      table={table}
      showCveColumns={showCveColumns}
    />
  );
};

const DEFAULT_ECOSYSTEMS: EcosystemInfo[] = [
  { name: 'Java', supported: true },
  { name: 'Python', supported: true },
  { name: 'JavaScript', supported: true },
];

const renderTable = (ecosystems: EcosystemInfo[] = DEFAULT_ECOSYSTEMS, showCveColumns = true) =>
  render(
    <ReactQueryTestWrapper>
      <PackageCoverageTableHarness ecosystems={ecosystems} showCveColumns={showCveColumns} />
    </ReactQueryTestWrapper>,
  );

describe('PackageCoverageTable', () => {
  beforeEach(() => {
    (useCoverageReportPackagesQuery as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        data: defaultCoverageReportPackagesItem,
        meta: { count: 3, limit: 20, offset: 0 },
      },
    }));
  });

  it('renders package rows with name, version, ecosystem, and match status labels', () => {
    renderTable();

    expect(screen.getByText('spring-web')).toBeInTheDocument();
    expect(screen.getByText('flask')).toBeInTheDocument();
    expect(screen.getByText('lodash')).toBeInTheDocument();

    expect(screen.getByText('6.1.5')).toBeInTheDocument();
    expect(screen.getByText('3.0.3')).toBeInTheDocument();
    expect(screen.getByText('4.17.21')).toBeInTheDocument();

    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();

    expect(screen.getByText('Exact')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('labels unsupported ecosystems in package rows', () => {
    renderTable([
      { name: 'Java', supported: true },
      { name: 'Python', supported: true },
      { name: 'JavaScript', supported: false },
    ]);

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Unsupported')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderTable();

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(6);
    expect(headers[0]).toHaveTextContent('Package');
    expect(headers[1]).toHaveTextContent('Version');
    expect(headers[2]).toHaveTextContent('Ecosystem');
    expect(headers[3]).toHaveTextContent('Match');
    expect(headers[4]).toHaveTextContent('CVE Fixes (net delta)');
    expect(headers[5]).toHaveTextContent('CVSS Scores');
  });

  it('renders CVE fix counts and CVSS score ranges', () => {
    renderTable();

    // spring-web: critical 2, important 3, moderate 1, no low; range 5.4–9.8
    const springRow = screen.getByText('spring-web').closest('tr')!;
    expect(within(springRow).getByText('2')).toBeInTheDocument();
    expect(within(springRow).getByText('3')).toBeInTheDocument();
    expect(within(springRow).getByText('1')).toBeInTheDocument();
    expect(within(springRow).getByText('5.4–9.8')).toBeInTheDocument();

    // lodash has no CVEs: both columns show an em dash
    const lodashRow = screen.getByText('lodash').closest('tr')!;
    expect(within(lodashRow).getAllByText('—')).toHaveLength(2);
  });

  it('hides the CVE columns when the report has no CVE data', () => {
    renderTable(DEFAULT_ECOSYSTEMS, false);

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(screen.queryByText('CVE Fixes (net delta)')).not.toBeInTheDocument();
    expect(screen.queryByText('CVSS Scores')).not.toBeInTheDocument();

    // The CVSS range that would appear in the dropped column is gone too.
    expect(screen.queryByText('5.4–9.8')).not.toBeInTheDocument();
  });

  it('shows empty state when no packages are returned', () => {
    (useCoverageReportPackagesQuery as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        data: [],
        meta: { count: 0, limit: 20, offset: 0 },
      },
    }));

    renderTable();
    expect(screen.getByText('No packages were found in this manifest.')).toBeInTheDocument();
  });

  it('shows error state on query error', () => {
    (useCoverageReportPackagesQuery as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isFetching: false,
      isError: true,
    }));

    renderTable();
    expect(screen.getByText('Unable to load packages')).toBeInTheDocument();
  });

  it('renders filter controls for search, match, and ecosystem', async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByPlaceholderText('Search packages...')).toBeInTheDocument();

    const filterCategoryToggle = screen.getByRole('button', { name: 'Package' });
    await user.click(filterCategoryToggle);

    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Package' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Match' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Ecosystem' })).toBeInTheDocument();
  });
});
