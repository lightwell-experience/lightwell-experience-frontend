import { render, screen, waitFor, within } from '@testing-library/react';
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
  expect(screen.getByText('LWL-2026-4401')).toBeInTheDocument();
});

it('renders the beacon page with status summary and vulnerability table', async () => {
  renderBeacon();
  await selectCustomer('CID-01');

  await waitFor(() => {
    expect(screen.getByText('Status Summary')).toBeInTheDocument();
  });
  expect(screen.getAllByText('No remediation')).toHaveLength(2);
  expect(screen.getAllByText('On Hold')).toHaveLength(2);

  const summary = document.querySelector('.lw-c-metrics-card');
  expect(summary).toBeTruthy();
  const summaryCritical = within(summary as HTMLElement).getByText('Critical');
  const summaryOnHold = within(summary as HTMLElement).getByText('On Hold');
  const summaryNoRemediation = within(summary as HTMLElement).getByText('No remediation');
  expect(
    summaryCritical.compareDocumentPosition(summaryOnHold) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    summaryOnHold.compareDocumentPosition(summaryNoRemediation) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(summaryOnHold.closest('.lw-c-metrics-count')).toHaveStyle({
    '--lw-metrics-count-bar-color': 'var(--lw-color--match-status--none)',
  });

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
  expect(screen.getByText('LWL-2026-4401')).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Filter categories' })).toBeInTheDocument();
  expect(screen.getByText('Customer ID')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'CID-01' })).toBeInTheDocument();
});

it('renders PF scroll-container wrappers required by the sticky Package/Vulnerability ID columns', async () => {
  const { container } = renderBeacon();
  await selectCustomer('CID-01');

  await waitFor(() => {
    expect(screen.getByText('LWL-2026-4401')).toBeInTheDocument();
  });
  // isSticky must be set on LwDataView for these to render at all — without
  // it, DataViewTableBasic renders a bare <Table> and isStickyColumn on the
  // Package/Vulnerability ID columns has nothing to attach sticky behavior to.
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

it('clears the ticket filter when the customer changes and keeps other filters', async () => {
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
  expect(within(filterPanel).getByRole('checkbox', { name: /critical/i })).toBeChecked();
  expect(
    (useBeaconData as jest.Mock).mock.calls
      .filter(([customerId]) => customerId === 'CID-214')
      .every(([, filters]) => !filters?.ltwlsuptTicketIds?.length),
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
  expect(document.querySelector('.pf-m-text-3xl')).toBeInTheDocument();
  expect(screen.queryByText('Total')).not.toBeInTheDocument();
  expect(screen.getByText('Beacon')).toBeInTheDocument();
  expect(screen.getByText('Customer ID')).toBeInTheDocument();
  expect(screen.getByText('Filters')).toBeInTheDocument();
});
