import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Beacon from './Beacon';
import { ReactQueryTestWrapper } from 'testingHelpers';

jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: jest.fn(),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

jest.mock('Hooks/Lightwell/navigation/useLightwellRootPath', () => ({
  useLightwellRootPath: jest.fn(() => '/lightwell'),
}));

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: () => ({
    requestPdf: jest.fn(),
  }),
}));

// config/setupAfterEnv.ts mocks useDebounce as identity. Keep that by default, but let a test opt
// into the real debounce (the real hook is always called so hook order stays stable).
const mockDebounce = { isReal: false };
jest.mock('Hooks/useDebounce', () => {
  const actual = jest.requireActual('Hooks/useDebounce').default;
  return {
    __esModule: true,
    default: <T,>(value: T, delay?: number): T => {
      const debounced = actual(value, delay);
      return mockDebounce.isReal ? debounced : value;
    },
  };
});

jest.mock('./hooks/useBeaconData', () => ({
  useBeaconData: jest.fn(),
}));

jest.mock('./hooks/useBeaconExport', () => ({
  useBeaconExport: jest.fn(() => ({
    isBusy: false,
    items: [
      { id: 'csv', children: 'Export as CSV' },
      { id: 'json', children: 'Export as JSON' },
      { id: 'pdf', children: 'Export as PDF' },
    ],
  })),
}));

jest.mock('services/Lightwell/CustomerQueries', () => ({
  useCustomerIdsQuery: jest.fn(),
}));

jest.mock('services/Lightwell/BeaconQueries', () => ({
  useBeaconStatusQuery: jest.fn(),
  useLtwlsuptTicketIdsQuery: jest.fn(),
}));

import { useBeaconData } from './hooks/useBeaconData';
import { useCustomerIdsQuery } from 'services/Lightwell/CustomerQueries';
import { useBeaconStatusQuery, useLtwlsuptTicketIdsQuery } from 'services/Lightwell/BeaconQueries';
import { mockVulnerabilities } from '../mockVulnerabilities';

const mockBeaconData = {
  vulnerabilities: mockVulnerabilities,
  meta: {
    count: mockVulnerabilities.length,
    criticalCount: mockVulnerabilities.filter((v) => v.severity === 'Critical').length,
    statusCounts: Object.fromEntries(
      mockVulnerabilities.reduce<Map<string, number>>((counts, vulnerability) => {
        counts.set(vulnerability.status, (counts.get(vulnerability.status) ?? 0) + 1);
        return counts;
      }, new Map()),
    ),
  },
};

const renderBeacon = () =>
  render(
    <ReactQueryTestWrapper>
      <Beacon />
    </ReactQueryTestWrapper>,
  );

const selectCustomer = async (customerId: string) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Select customer ID' }));
  await user.click(await screen.findByRole('menuitem', { name: customerId }));
  return user;
};

beforeEach(() => {
  // Simulate a ≥2xl viewport so the filter drawer is inline and open by default.
  // JSDOM doesn't apply CSS, so we need a matchMedia mock for useLwBreakpoint.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn(() => ({
      matches: true,
      media: '',
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  (useCustomerIdsQuery as jest.Mock).mockReturnValue({
    isLoading: false,
    data: ['CID-01', 'CID-214'],
  });

  (useBeaconData as jest.Mock).mockReturnValue({
    isLoading: false,
    isPlaceholderData: false,
    isError: false,
    error: null,
    data: mockBeaconData,
  });

  (useLtwlsuptTicketIdsQuery as jest.Mock).mockReturnValue({
    isLoading: false,
    data: ['batch-1', 'batch-2'],
  });

  (useBeaconStatusQuery as jest.Mock).mockReturnValue({
    data: '10-02-2026 08:00',
  });
});

it('shows when beacon data was last updated under the page title', async () => {
  renderBeacon();

  expect(
    screen.getByText(/Track your Lightwell submissions from initial review to fix availability/),
  ).toHaveTextContent('Last updated: 10-02-2026 08:00');
});

it('omits the last updated time until a sync has completed', async () => {
  (useBeaconStatusQuery as jest.Mock).mockReturnValue({ data: undefined });

  renderBeacon();

  expect(
    screen.getByText('Track your Lightwell submissions from initial review to fix availability.'),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
});

it('shows an empty state until a customer is selected', async () => {
  renderBeacon();

  await waitFor(() => {
    expect(
      screen.getByText('Select a customer ID to view their Lightwell submissions.'),
    ).toBeInTheDocument();
  });

  expect(screen.queryByText('Status Summary')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Select customer ID' })).toBeInTheDocument();
});

it('preselects the customer when only one is available', async () => {
  (useCustomerIdsQuery as jest.Mock).mockReturnValue({
    isLoading: false,
    data: ['CID-01'],
  });

  renderBeacon();

  await waitFor(() => {
    expect(screen.getByText('Status Summary')).toBeInTheDocument();
  });

  expect(screen.getByRole('button', { name: 'CID-01' })).toBeInTheDocument();
  expect(screen.getByText('JNDI injection via crafted log message')).toBeInTheDocument();
});

it('renders the beacon page with status summary and vulnerability table', async () => {
  renderBeacon();
  await selectCustomer('CID-01');

  await waitFor(() => {
    expect(screen.getByText('Status Summary')).toBeInTheDocument();
  });

  const summaryDonut = document.querySelector('.lw-c-metrics-donut-chart') as HTMLElement;
  expect(summaryDonut).toBeInTheDocument();
  expect(within(summaryDonut).getByText(String(mockBeaconData.meta.count))).toBeInTheDocument();
  expect(within(summaryDonut).getByText('Total')).toBeInTheDocument();

  const countOf = (status: string) => mockVulnerabilities.filter((v) => v.status === status).length;
  const onHold = countOf('On Hold');
  const noRemediation = countOf('Unremediated');
  const inPipeline = mockVulnerabilities.length - onHold - noRemediation;
  const summaryLegend = within(summaryDonut).getByRole('list', {
    name: 'Vulnerability status summary',
  });
  expect(
    within(summaryLegend)
      .getAllByRole('listitem')
      .map((row) => row.textContent),
  ).toEqual([
    `On Hold: ${onHold}`,
    `No remediation: ${noRemediation}`,
    `In Pipeline: ${inPipeline}`,
  ]);

  const filters = screen.getByRole('form', { name: 'Filter categories' });
  const filterNetwork = within(filters as HTMLElement).getByText('Available in Lightwell Network');
  const filterOnHold = within(filters as HTMLElement).getByText('On Hold');
  const filterNoRemediation = within(filters as HTMLElement).getByText('No remediation');
  expect(
    filterNetwork.compareDocumentPosition(filterOnHold) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    filterOnHold.compareDocumentPosition(filterNoRemediation) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  expect(screen.getByLabelText('Submission pipeline metrics')).not.toHaveTextContent('On Hold');
  expect(screen.getByText('JNDI injection via crafted log message')).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Filter categories' })).toBeInTheDocument();
  expect(screen.getByText('Customer ID')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'CID-01' })).toBeInTheDocument();
});

it('renders PF scroll-container wrappers required by the sticky Package/Title columns', async () => {
  const { container } = renderBeacon();
  await selectCustomer('CID-01');

  await waitFor(() => {
    expect(screen.getByText('JNDI injection via crafted log message')).toBeInTheDocument();
  });
  // isSticky must be set on LwDataView for these to render at all — without
  // it, DataViewTableBasic renders a bare <Table> and isStickyColumn on the
  // Package/Title columns has nothing to attach sticky behavior to.
  expect(container.querySelector('.pf-v6-c-scroll-outer-wrapper')).toBeInTheDocument();
  expect(container.querySelector('.pf-v6-c-scroll-inner-wrapper')).toBeInTheDocument();
});

it('shows support ticket IDs from the dedicated API instead of vulnerability rows', async () => {
  (useLtwlsuptTicketIdsQuery as jest.Mock).mockReturnValue({
    isLoading: false,
    data: ['api-ticket'],
  });

  renderBeacon();
  await selectCustomer('CID-01');

  const filterPanel = await waitFor(() => {
    const panel = screen.getByRole('form', { name: 'Filter categories' });
    expect(panel).toBeInTheDocument();
    return panel;
  });
  expect(within(filterPanel).getByText('api-ticket')).toBeInTheDocument();
  expect(within(filterPanel).queryByText('batch-1')).not.toBeInTheDocument();
  expect(within(filterPanel).queryByText('batch-2')).not.toBeInTheDocument();
});

it('clears every filter when the customer changes', async () => {
  renderBeacon();
  const user = await selectCustomer('CID-01');

  const filterPanel = await waitFor(() => {
    const panel = screen.getByRole('form', { name: 'Filter categories' });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('batch-1')).toBeInTheDocument();
    return panel;
  });

  await user.click(within(filterPanel).getByText('batch-1'));
  await user.click(within(filterPanel).getByText('Critical'));
  expect(within(filterPanel).getByRole('checkbox', { name: /batch-1/i })).toBeChecked();
  expect(within(filterPanel).getByRole('checkbox', { name: /critical/i })).toBeChecked();

  await user.click(screen.getByRole('button', { name: 'CID-01' }));
  await user.click(await screen.findByRole('menuitem', { name: 'CID-214' }));

  expect(screen.getByRole('button', { name: 'CID-214' })).toBeInTheDocument();
  expect(within(filterPanel).getByRole('checkbox', { name: /batch-1/i })).not.toBeChecked();
  expect(within(filterPanel).getByRole('checkbox', { name: /critical/i })).not.toBeChecked();
  expect(
    (useBeaconData as jest.Mock).mock.calls
      .filter(([customerId]) => customerId === 'CID-214')
      .every(([, filters]) => !filters?.ltwlsuptTicketIds?.length && !filters?.severities?.length),
  ).toBe(true);
});

it('keeps the status summary card header while metrics are loading', async () => {
  (useCustomerIdsQuery as jest.Mock).mockReturnValue({
    isLoading: false,
    data: ['CID-01'],
  });
  (useBeaconData as jest.Mock).mockReturnValue({
    isLoading: true,
    isError: false,
    error: null,
    data: undefined,
  });

  renderBeacon();

  await waitFor(() => {
    expect(screen.getByText('Status Summary')).toBeInTheDocument();
  });

  expect(document.querySelector('.lw-c-metrics-card')).toBeInTheDocument();
  expect(document.querySelector('.lw-c-loaded.lw-m-loading')).toBeInTheDocument();
  expect(document.querySelectorAll('.pf-v6-c-skeleton').length).toBeGreaterThan(0);
  expect(screen.getByText('Loading status summary')).toBeInTheDocument();
  expect(document.querySelector('.lw-c-metrics-donut-chart')).not.toBeInTheDocument();
  expect(screen.queryByText('Total')).not.toBeInTheDocument();
  expect(screen.getByText('Beacon')).toBeInTheDocument();
  expect(screen.getByText('Customer ID')).toBeInTheDocument();
  expect(screen.getByText('Filters')).toBeInTheDocument();
});

const emptyBeaconData = {
  vulnerabilities: [],
  meta: { count: 0, criticalCount: 0, statusCounts: {} },
};

it('hides the filters, table headers and Export when the customer has no data', async () => {
  (useBeaconData as jest.Mock).mockReturnValue({
    isLoading: false,
    isError: false,
    error: null,
    data: emptyBeaconData,
  });

  renderBeacon();
  await selectCustomer('CID-01');

  expect(await screen.findByText('No submissions yet')).toBeInTheDocument();
  expect(screen.queryByRole('form', { name: 'Filter categories' })).not.toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: 'Filter vulnerabilities by ID, package, or title' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('grid', { name: 'Vulnerability tracking table' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument();
  // The customer selector stays available so the user can switch customers.
  expect(screen.getByRole('button', { name: 'CID-01' })).toBeInTheDocument();
});

it('keeps the filters, table headers and Export when filters narrow the results to zero', async () => {
  (useBeaconData as jest.Mock).mockImplementation(
    (_customerId: string, filters?: { severities?: string[] }) => ({
      isLoading: false,
      isError: false,
      error: null,
      data: filters?.severities?.length ? emptyBeaconData : mockBeaconData,
    }),
  );

  renderBeacon();
  const user = await selectCustomer('CID-01');

  const filterPanel = await screen.findByRole('form', { name: 'Filter categories' });
  await user.click(within(filterPanel).getByText('Critical'));

  expect(await screen.findByText('No results match the current filters')).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Filter categories' })).toBeInTheDocument();
  expect(screen.getByRole('grid', { name: 'Vulnerability tracking table' })).toBeInTheDocument();
  // Nothing to export at 0 rows, filtered or not.
  expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(await screen.findByText(mockVulnerabilities[0].vulnerabilityId)).toBeInTheDocument();
});

it('keeps the filtered view, not "No submissions yet", while Reset refetches (placeholder data)', async () => {
  let isRefetchingAfterReset = false;
  (useBeaconData as jest.Mock).mockImplementation(
    (_customerId: string, filters?: { severities?: string[] }) => {
      if (filters?.severities?.length) {
        return {
          isLoading: false,
          isPlaceholderData: false,
          isError: false,
          error: null,
          data: emptyBeaconData,
        };
      }
      // Filters cleared: react-query keeps the previous (empty) response as placeholder data
      // until the unfiltered refetch lands.
      return {
        isLoading: false,
        isPlaceholderData: isRefetchingAfterReset,
        isError: false,
        error: null,
        data: isRefetchingAfterReset ? emptyBeaconData : mockBeaconData,
      };
    },
  );

  renderBeacon();
  const user = await selectCustomer('CID-01');

  const filterPanel = await screen.findByRole('form', { name: 'Filter categories' });
  await user.click(within(filterPanel).getByText('Critical'));
  expect(await screen.findByText('No results match the current filters')).toBeInTheDocument();

  isRefetchingAfterReset = true;
  await user.click(screen.getByRole('button', { name: 'Reset filters' }));

  expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Filter categories' })).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: 'Filter vulnerabilities by ID, package, or title' }),
  ).toBeInTheDocument();
  // Placeholder rows still carry the previous 0 count, so there is nothing to export yet.
  expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
});

it('does not count a 1-character search as an applied filter in the status summary badge', async () => {
  let isDatasetEmpty = false;
  (useBeaconData as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isPlaceholderData: false,
    isError: false,
    error: null,
    data: isDatasetEmpty ? emptyBeaconData : mockBeaconData,
  }));

  renderBeacon();
  const user = await selectCustomer('CID-01');
  const searchName = 'Filter vulnerabilities by ID, package, or title';
  const search = await screen.findByRole('textbox', { name: searchName });
  expect(screen.getByText('Status Summary')).toBeInTheDocument();

  // A 1-character search is never sent to the API, so it is not an applied filter: no
  // "(filtered)" badge. LwDataView still keeps the search box mounted for any non-empty value
  // so the input can't vanish mid-typing.
  isDatasetEmpty = true;
  await user.type(search, 'a');
  expect(await screen.findByRole('textbox', { name: searchName })).toHaveValue('a');
  expect(screen.getByText('Status Summary')).toBeInTheDocument();
  expect(screen.queryByText('Status Summary (filtered)')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
});

it('keeps the search box mounted while a search refetches in filtered-to-zero', async () => {
  const searchName = 'Filter vulnerabilities by ID, package, or title';
  (useBeaconData as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isPlaceholderData: true,
    isError: false,
    error: null,
    data: emptyBeaconData,
  }));

  renderBeacon();
  const user = await selectCustomer('CID-01');
  const search = await screen.findByRole('textbox', { name: searchName });

  await user.type(search, 'ab');

  // Same node, still focused: the toolbar never unmounted during the placeholder refetch.
  expect(screen.getByRole('textbox', { name: searchName })).toBe(search);
  expect(search).toHaveFocus();
  expect(search).toHaveValue('ab');
  expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
});

// The search is debounced, so for one commit after Reset/clear the UI state is already empty while
// the displayed rows are still the filtered result. That must stay "filtered to zero" (toolbar and
// Reset mounted), never flash "No submissions yet" or drop focus.
describe('clearing a search-only filter that returned zero rows', () => {
  const searchName = 'Filter vulnerabilities by ID, package, or title';

  const setUpFilteredToZero = async () => {
    mockDebounce.isReal = true;
    (useBeaconData as jest.Mock).mockImplementation(
      (_customerId: string, filters?: { search?: string }) => ({
        isLoading: false,
        isPlaceholderData: false,
        isError: false,
        error: null,
        data: filters?.search ? emptyBeaconData : mockBeaconData,
      }),
    );

    renderBeacon();
    const user = await selectCustomer('CID-01');
    await user.type(await screen.findByRole('textbox', { name: searchName }), 'zz');
    expect(await screen.findByText('No results match the current filters')).toBeInTheDocument();

    // Switch to fake timers only now so the next debounce tick is under test control. Use
    // `fireEvent` below, not userEvent: its async wrapper advances fake timers by 0 after every
    // action, which would run the debounce tick before the assertion.
    jest.useFakeTimers();
  };

  const expectStillFilteredToZero = () => {
    expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
    expect(screen.getByText('No results match the current filters')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: searchName })).toBeInTheDocument();
  };

  afterEach(() => {
    jest.useRealTimers();
    mockDebounce.isReal = false;
  });

  it('keeps the filtered view when Reset filters is clicked', async () => {
    await setUpFilteredToZero();

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expectStillFilteredToZero();

    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(await screen.findByText(mockVulnerabilities[0].vulnerabilityId)).toBeInTheDocument();
    expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
  });

  it('keeps the filtered view when the search is cleared', async () => {
    await setUpFilteredToZero();

    fireEvent.change(screen.getByRole('textbox', { name: searchName }), { target: { value: '' } });
    expectStillFilteredToZero();

    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(await screen.findByText(mockVulnerabilities[0].vulnerabilityId)).toBeInTheDocument();
    expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
  });
});
