import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoverageReport from './CoverageReport';
import { useCoverageReport } from './hooks/useCoverageReport';
import {
  defaultCoverageReportItem,
  defaultCoverageReportPackagesItem,
  ReactQueryTestWrapper,
} from 'testingHelpers';
import { useLightwellNavigateTo } from 'Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { useCoverageReportPackagesQuery } from 'services/Lightwell/CoverageReportsQueries';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: () => ({
    requestPdf: jest.fn(),
  }),
}));

jest.mock('Hooks/useNotification', () => () => ({ notify: jest.fn() }));
jest.mock('Hooks/useErrorNotification', () => () => jest.fn());

jest.mock('./hooks/useCoverageReport');

jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: jest.fn(),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

jest.mock('Hooks/Lightwell/navigation/useLightwellRootPath', () => ({
  useLightwellRootPath: jest.fn(() => '/lightwell'),
}));

// Kit chart assemblies are tested in their own files; silence them here
jest.mock('kit/components/assemblies', () => {
  const actual = jest.requireActual('kit/components/assemblies');
  return {
    ...actual,
    LwMetricsDonutChart: () => null,
    LwMetricsStackChart: () => null,
  };
});

jest.mock('services/Lightwell/CoverageReportsQueries', () => ({
  ...jest.requireActual('services/Lightwell/CoverageReportsQueries'),
  useCoverageReportPackagesQuery: jest.fn(),
}));

const mockNavigateTo = jest.fn();

jest.mock('Hooks/Lightwell/navigation/useLightwellNavigateTo', () => ({
  useLightwellNavigateTo: jest.fn(),
}));

const renderCoverageReport = () =>
  render(
    <ReactQueryTestWrapper>
      <CoverageReport />
    </ReactQueryTestWrapper>,
  );

describe('CoverageReport', () => {
  beforeEach(() => {
    (useCoverageReport as jest.Mock).mockReturnValue({
      filename: 'test-sbom.json',
      report: defaultCoverageReportItem,
      isLoading: false,
      startOver: jest.fn(),
    });
    (useCoverageReportPackagesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        data: defaultCoverageReportPackagesItem,
        meta: { count: 3, limit: 20, offset: 0 },
      },
    });
    (useLightwellNavigateTo as jest.Mock).mockReturnValue({
      navigateTo: mockNavigateTo,
    });
  });

  it('shows "New analysis" when a report is complete', () => {
    renderCoverageReport();
    expect(screen.getByRole('button', { name: 'New analysis' })).toBeInTheDocument();
  });

  it('displays the match analysis title and manifest filename', () => {
    renderCoverageReport();
    expect(
      screen.getByRole('heading', { name: 'Match analysis for test-sbom.json' }),
    ).toBeInTheDocument();
  });

  it('displays coverage summary with in-network percentage and match counts', () => {
    renderCoverageReport();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /75% of packages match the Lightwell Network catalog/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '60' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '15' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByText('Exact match')).toBeInTheDocument();
    expect(screen.getByText('Partial match')).toBeInTheDocument();
  });

  it.each([0, undefined])('hides the skipped-package warning for count %s', (skipped_entries) => {
    (useCoverageReport as jest.Mock).mockReturnValue({
      report: { ...defaultCoverageReportItem, skipped_entries },
      isLoading: false,
      startOver: jest.fn(),
    });
    renderCoverageReport();
    expect(screen.queryByRole('heading', { name: /packages? skipped/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View supported formats' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [1, '1 package skipped', "Its entry doesn't match a supported format."],
    [987, '987 packages skipped', "Their entries don't match a supported format."],
  ])(
    'shows the warning and format help for %s skipped packages',
    async (skipped_entries, title, message) => {
      (useCoverageReport as jest.Mock).mockReturnValue({
        filename: 'test-sbom.json',
        report: { ...defaultCoverageReportItem, skipped_entries },
        isLoading: false,
        startOver: jest.fn(),
      });
      renderCoverageReport();
      expect(screen.getByRole('heading', { name: new RegExp(title) })).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'View supported formats' }));
      expect(await screen.findByText('What should my manifest contain?')).toBeInTheDocument();
      expect(screen.getByText('What is the maximum manifest size?')).toBeInTheDocument();
    },
  );

  it('displays the CVEs fixed card with per-severity counts', () => {
    renderCoverageReport();
    expect(screen.getByRole('heading', { level: 4, name: 'Fixed CVEs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'CVEs fixed' })).not.toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('hides the CVEs fixed card when every severity count is zero', () => {
    (useCoverageReport as jest.Mock).mockReturnValue({
      filename: 'test-sbom.json',
      report: {
        ...defaultCoverageReportItem,
        cve_summary: { critical: 0, important: 0, moderate: 0, low: 0 },
      },
      isLoading: false,
      startOver: jest.fn(),
    });

    renderCoverageReport();

    expect(screen.queryByRole('heading', { level: 3, name: 'CVEs fixed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Fixed CVEs' })).not.toBeInTheDocument();
  });

  it('displays ecosystem breakdown with package counts', () => {
    renderCoverageReport();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Packages by ecosystem' }),
    ).toBeInTheDocument();
    const paragraphs = screen.getAllByRole('paragraph');
    expect(paragraphs.some((p) => p.textContent?.includes('75 of 100 packages'))).toBe(true);
  });
});
