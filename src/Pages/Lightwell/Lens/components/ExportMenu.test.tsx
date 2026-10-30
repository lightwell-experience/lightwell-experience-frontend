import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertVariant } from '@patternfly/react-core';

import { ExportMenu } from './ExportMenu';
import { getCoverageReportPackages } from 'services/Lightwell/CoverageReportsApi';
jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: jest.fn(),
}));

jest.mock('services/Lightwell/CoverageReportsApi', () => {
  const actual = jest.requireActual('services/Lightwell/CoverageReportsApi');
  return {
    ...actual,
    getCoverageReportPackages: jest.fn(),
  };
});

jest.mock('Hooks/useErrorNotification', () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock('Hooks/useNotification', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import useNotification from 'Hooks/useNotification';

const requestPdf = jest.fn().mockResolvedValue(undefined);
const notify = jest.fn();

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  (useChrome as jest.Mock).mockReturnValue({ requestPdf });
  (useNotification as jest.Mock).mockReturnValue({ notify });
  requestPdf.mockReset();
  requestPdf.mockResolvedValue(undefined);
  notify.mockClear();
  (getCoverageReportPackages as jest.Mock).mockReset();
  (getCoverageReportPackages as jest.Mock).mockResolvedValue({
    data: [],
    links: { first: '', last: '' },
    meta: { count: 1, limit: 1, offset: 0 },
  });
});

describe('ExportMenu PDF', () => {
  it('requests one PDF so the package table is not split across documents', async () => {
    const user = userEvent.setup();
    render(
      <ExportMenu
        uuid='report-uuid'
        filename='sbom.json'
        filters={{ match_status: ['exact'] }}
        packageCount={1}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).not.toHaveBeenCalled();

    const pdfRequest = requestPdf.mock.calls[0][0];
    expect(pdfRequest.filename).toBe('lightwell-match-analysis-report-uuid.pdf');
    expect(pdfRequest.payload).toHaveLength(1);
    expect(pdfRequest.payload[0]).toMatchObject({
      module: './CoveragePdfEntry',
      fetchDataParams: {
        uuid: 'report-uuid',
        includeSummary: true,
        includePackages: true,
        filters: { match_status: ['exact'] },
      },
      additionalData: {
        includeSummary: true,
        includePackages: true,
        filename: 'sbom.json',
        headerBrand: 'lightwell',
      },
    });
    // CVE data is present by default, so each page keeps it.
    expect(pdfRequest.payload[0].additionalData).toMatchObject({ includeCveData: true });
  });

  it('omits CVE columns from the PDF when there is no CVE data', async () => {
    const user = userEvent.setup();
    render(
      <ExportMenu
        uuid='report-uuid'
        filename='sbom.json'
        includeCveData={false}
        packageCount={1}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });

    const pdfRequest = requestPdf.mock.calls[0][0];
    expect(pdfRequest.payload[0].additionalData).toMatchObject({ includeCveData: false });
  });

  it('closes the menu and shows generating feedback while the PDF is in progress', async () => {
    let resolvePdf: () => void = () => undefined;
    requestPdf.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePdf = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' packageCount={1} />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'PDF' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Exporting' })).toBeDisabled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: AlertVariant.info,
        title: 'Generating PDF',
      }),
    );

    resolvePdf();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export as' })).toBeEnabled();
    });
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: AlertVariant.success,
        title: 'PDF ready',
      }),
    );
  });

  it('disables the toggle when no report uuid is available', () => {
    render(<ExportMenu />);
    expect(screen.getByRole('button', { name: 'Export as' })).toBeDisabled();
  });

  it('exports a PDF with 1,500 packages without asking to drop the package list', async () => {
    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' packageCount={1500} />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByRole('heading', { name: 'Package list exceeds PDF export limit' }),
    ).not.toBeInTheDocument();
    expect(getCoverageReportPackages).not.toHaveBeenCalled();
    expect(requestPdf.mock.calls[0][0].payload[0].fetchDataParams).toMatchObject({
      includePackages: true,
    });
  });

  it('explains the PDF limit and can export the overview only', async () => {
    const user = userEvent.setup();
    render(
      <ExportMenu
        uuid='report-uuid'
        filename='sbom.json'
        filters={{ match_status: ['exact'] }}
        packageCount={1501}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    expect(
      screen.getByRole('heading', { name: 'Package list exceeds PDF export limit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This list exceeds the 1,500-package PDF limit. You can export the overview as a PDF, or filter the list to 1,500 packages or fewer.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('To export the current package list, use CSV or JSON.'),
    ).toBeInTheDocument();
    expect(requestPdf).not.toHaveBeenCalled();
    expect(getCoverageReportPackages).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // PatternFly 6.7 keeps the dialog mounted through the close animation.
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Package list exceeds PDF export limit' }),
      ).not.toBeInTheDocument();
    });
    expect(requestPdf).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));
    await user.click(screen.getByRole('button', { name: 'Export overview PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).not.toHaveBeenCalled();
    const pdfRequest = requestPdf.mock.calls[0][0];
    expect(pdfRequest.payload).toHaveLength(1);
    expect(pdfRequest.payload[0].fetchDataParams).toMatchObject({
      uuid: 'report-uuid',
      includeSummary: true,
      includePackages: false,
      filters: { match_status: ['exact'] },
    });
    expect(pdfRequest.payload[0].additionalData).toMatchObject({
      includeSummary: true,
      includePackages: false,
    });
  });

  it('reads the package total once when it is not already known, then exports the overview', async () => {
    (getCoverageReportPackages as jest.Mock).mockResolvedValue({
      data: [],
      links: { first: '', last: '' },
      meta: { count: 3000, limit: 1, offset: 0 },
    });

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' filters={{ search: 'log4j' }} />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Package list exceeds PDF export limit' }),
      ).toBeInTheDocument();
    });
    expect(getCoverageReportPackages).toHaveBeenCalledTimes(1);
    expect(getCoverageReportPackages).toHaveBeenCalledWith('report-uuid', 1, 1, {
      search: 'log4j',
    });
    expect(screen.getByText(/This list exceeds the 1,500-package PDF limit/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export overview PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).toHaveBeenCalledTimes(1);
    expect(requestPdf.mock.calls[0][0].payload[0].fetchDataParams).toMatchObject({
      includePackages: false,
    });
  });
});

describe('oversized PDF alternatives', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:coverage');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it.each([
    ['CSV', 'text/csv;charset=utf-8;'],
    ['JSON', 'application/json;charset=utf-8;'],
  ])('exports the filtered package list as %s from the modal', async (format, mimeType) => {
    (getCoverageReportPackages as jest.Mock).mockResolvedValue({
      data: [
        {
          name: 'react',
          version: '18.0.0',
          ecosystem: 'npm',
          covered: false,
          match_status: 'none',
        },
      ],
      links: { first: '', last: '' },
      meta: { count: 1, limit: 200, offset: 0 },
    });

    const user = userEvent.setup();
    render(
      <ExportMenu
        uuid='report-uuid'
        filename='sbom.json'
        filters={{ match_status: ['none'] }}
        packageCount={1501}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));
    await user.click(screen.getByRole('button', { name: `Export ${format}` }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).toHaveBeenCalledWith('report-uuid', 1, 200, {
      match_status: ['none'],
    });
    expect(requestPdf).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);

    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    expect(blob.type).toBe(mimeType);
    expect(await readBlob(blob)).toContain('react');
  });
});

describe('ExportMenu CSV', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:coverage');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it('fetches every filtered package page and downloads a CSV file', async () => {
    (getCoverageReportPackages as jest.Mock).mockResolvedValue({
      data: [
        {
          name: 'react',
          version: '18.0.0',
          ecosystem: 'npm',
          covered: true,
          match_status: 'exact',
        },
      ],
      links: { first: '', last: '' },
      meta: { count: 1, limit: 200, offset: 0 },
    });

    const user = userEvent.setup();
    render(
      <ExportMenu uuid='report-uuid' filename='sbom.json' filters={{ match_status: ['exact'] }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'CSV' }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).toHaveBeenCalledWith('report-uuid', 1, 200, {
      match_status: ['exact'],
    });
    expect(requestPdf).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error notification when fetching packages fails', async () => {
    (getCoverageReportPackages as jest.Mock).mockRejectedValue(new Error('boom'));

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'CSV' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export as' })).toBeEnabled();
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('neutralizes formula-leading values to prevent CSV injection', async () => {
    (getCoverageReportPackages as jest.Mock).mockResolvedValue({
      data: [
        {
          name: '=SUM(A1:A2)',
          version: '1.0.0',
          ecosystem: 'npm',
          covered: true,
          match_status: 'exact',
        },
      ],
      links: { first: '', last: '' },
      meta: { count: 1, limit: 200, offset: 0 },
    });

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'CSV' }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    const csv = await readBlob(blob);
    expect(csv).toContain(`'=SUM(A1:A2)`);
    expect(csv).not.toContain(`,=SUM(A1:A2)`);
  });
});

describe('ExportMenu JSON', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:coverage');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it('fetches every filtered package page and downloads a JSON file', async () => {
    const pkg = {
      name: 'react',
      version: '18.0.0',
      ecosystem: 'npm',
      covered: true,
      match_status: 'exact',
    };
    (getCoverageReportPackages as jest.Mock).mockResolvedValue({
      data: [pkg],
      links: { first: '', last: '' },
      meta: { count: 1, limit: 200, offset: 0 },
    });

    const user = userEvent.setup();
    render(
      <ExportMenu uuid='report-uuid' filename='sbom.json' filters={{ match_status: ['exact'] }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'JSON' }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).toHaveBeenCalledWith('report-uuid', 1, 200, {
      match_status: ['exact'],
    });
    expect(requestPdf).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);

    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json;charset=utf-8;');
    await expect(readBlob(blob)).resolves.toEqual(JSON.stringify([pkg], null, 2));
  });

  it('strips empty CVE fields from the JSON when there is no CVE data', async () => {
    const pkg = {
      name: 'react',
      version: '18.0.0',
      ecosystem: 'npm',
      covered: true,
      match_status: 'exact',
      cve_count: { critical: 0, important: 0, moderate: 0, low: 0 },
    };
    (getCoverageReportPackages as jest.Mock).mockResolvedValue({
      data: [pkg],
      links: { first: '', last: '' },
      meta: { count: 1, limit: 200, offset: 0 },
    });

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' includeCveData={false} />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'JSON' }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    const json = await readBlob(blob);
    expect(json).not.toContain('cve_count');
    expect(json).not.toContain('cve_range');
    expect(JSON.parse(json)).toEqual([
      { name: 'react', version: '18.0.0', ecosystem: 'npm', covered: true, match_status: 'exact' },
    ]);
  });

  it('surfaces an error notification when fetching packages fails', async () => {
    (getCoverageReportPackages as jest.Mock).mockRejectedValue(new Error('boom'));

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' />);

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'JSON' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export as' })).toBeEnabled();
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
