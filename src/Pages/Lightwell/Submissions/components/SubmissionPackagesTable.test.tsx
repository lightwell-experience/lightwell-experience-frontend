import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SubmissionPackagesTable, { toApiFilters } from './SubmissionPackagesTable';
import { useSubmissionPackagesQuery } from 'services/Lightwell/ClearinghouseQueries';

jest.mock('services/Lightwell/ClearinghouseQueries');
const mockedQuery = useSubmissionPackagesQuery as jest.Mock;

const packages = [
  {
    packageurl: 'pkg:maven/org.apache/commons-text@1.9',
    ecosystem: 'Java',
    name: 'org.apache:commons-text',
    version: '1.9',
    valid_purl: true,
  },
  {
    packageurl: 'pkg:npm/lodash',
    ecosystem: 'npm',
    name: 'lodash',
    version: '',
    valid_purl: false,
    invalid_reason: 'missing_version',
    invalid_detail: 'packageurl has no version',
  },
  {
    packageurl: 'foo-bar@1.2',
    ecosystem: 'Unknown',
    name: '',
    version: '',
    valid_purl: false,
    invalid_reason: 'not_a_purl',
    invalid_detail: 'purl scheme is not "pkg"',
  },
];

const mockQueryResult = (overrides = {}) =>
  mockedQuery.mockReturnValue({
    data: { data: packages, meta: { count: packages.length, limit: 10, offset: 0 } },
    isLoading: false,
    isFetching: false,
    isError: false,
    ...overrides,
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryResult();
});

describe('toApiFilters', () => {
  it('sends no filters when nothing is picked', () => {
    expect(toApiFilters({ ecosystem: [], validity: [] })).toEqual({});
  });

  it('maps a single validity choice to valid_purl', () => {
    expect(toApiFilters({ ecosystem: [], validity: ['valid'] })).toEqual({ valid_purl: true });
    expect(toApiFilters({ ecosystem: [], validity: ['invalid'] })).toEqual({ valid_purl: false });
  });

  it('ignores validity when both are picked and passes ecosystems through', () => {
    expect(toApiFilters({ ecosystem: ['Java'], validity: ['valid', 'invalid'] })).toEqual({
      ecosystem: ['Java'],
    });
  });
});

describe('SubmissionPackagesTable', () => {
  it('renders packages with their status', () => {
    render(<SubmissionPackagesTable uuid='sub-1' ecosystems={['Java', 'npm', 'Unknown']} />);

    expect(screen.getByText('org.apache:commons-text')).toBeInTheDocument();
    expect(screen.getByText('1.9')).toBeInTheDocument();
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Missing version')).toBeInTheDocument();
    expect(screen.getByText('Not a purl')).toBeInTheDocument();
  });

  it('shows the raw packageurl when it does not parse', () => {
    render(<SubmissionPackagesTable uuid='sub-1' ecosystems={['Unknown']} />);

    expect(screen.getByText('foo-bar@1.2').tagName).toBe('CODE');
  });

  it('shows the invalid detail on hover', async () => {
    const user = userEvent.setup();
    render(<SubmissionPackagesTable uuid='sub-1' ecosystems={['npm']} />);

    await user.hover(screen.getByText('Missing version'));

    expect(await screen.findByText('packageurl has no version')).toBeInTheDocument();
  });

  it('queries the first page with no filters', () => {
    render(<SubmissionPackagesTable uuid='sub-1' ecosystems={['Java']} />);

    expect(mockedQuery).toHaveBeenCalledWith('sub-1', 1, 10, {});
  });

  it('clears applied filters from the "Clear filters" link', async () => {
    const user = userEvent.setup();
    render(<SubmissionPackagesTable uuid='sub-1' ecosystems={['Java', 'npm']} />);

    await user.click(screen.getByRole('button', { name: /Filter by ecosystem/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Java' }));
    expect(mockedQuery).toHaveBeenLastCalledWith('sub-1', 1, 10, { ecosystem: ['Java'] });

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(mockedQuery).toHaveBeenLastCalledWith('sub-1', 1, 10, {});
  });

  it('shows an error state when loading fails', () => {
    mockQueryResult({ data: undefined, isError: true });
    render(<SubmissionPackagesTable uuid='sub-1' ecosystems={['Java']} />);

    expect(screen.getByText('Unable to load packages')).toBeInTheDocument();
  });
});
