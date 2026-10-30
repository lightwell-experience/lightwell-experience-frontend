import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertVariant } from '@patternfly/react-core';

import { ExportMenu } from './ExportMenu';
import { getVulnerabilities } from 'services/Lightwell/BeaconApi';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: jest.fn(),
}));

jest.mock('services/Lightwell/BeaconApi', () => {
  const actual = jest.requireActual('services/Lightwell/BeaconApi');
  return {
    ...actual,
    getVulnerabilities: jest.fn(),
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

beforeEach(() => {
  (useChrome as jest.Mock).mockReturnValue({ requestPdf });
  (useNotification as jest.Mock).mockReturnValue({ notify });
  requestPdf.mockReset();
  requestPdf.mockResolvedValue(undefined);
  notify.mockClear();
  (getVulnerabilities as jest.Mock).mockReset();
});

describe('ExportMenu PDF', () => {
  it('requests a split PDF from crc-pdf-generator without fetching every row', async () => {
    const user = userEvent.setup();
    render(
      <ExportMenu
        customerId='CID-01'
        visibleColumns={[{ key: 'vulnerabilityId', title: 'Vulnerability ID' }]}
        itemCount={120}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export as' }));
    await user.click(screen.getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });
    expect(getVulnerabilities).not.toHaveBeenCalled();
    const pdfRequest = requestPdf.mock.calls[0][0];
    expect(pdfRequest.filename).toBe('lightwell-beacon-CID-01.pdf');
    expect(pdfRequest.payload).toHaveLength(3);
    expect(pdfRequest.payload[0]).toMatchObject({
      module: './BeaconPdfEntry',
      landscape: false,
      fetchDataParams: { customerId: 'CID-01', limit: 50, offset: 0 },
      additionalData: { includeSummary: true, customerId: 'CID-01', headerBrand: 'lightwell' },
    });
    expect(pdfRequest.payload[1].fetchDataParams.offset).toBe(50);
    expect(pdfRequest.payload[2].fetchDataParams.offset).toBe(100);
  });

  it('closes the menu and shows generating feedback while the PDF is in progress', async () => {
    let resolvePdf: () => void = () => undefined;
    requestPdf.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePdf = resolve;
      }),
    );

    const user = userEvent.setup();
    render(
      <ExportMenu
        customerId='CID-01'
        visibleColumns={[{ key: 'vulnerabilityId', title: 'Vulnerability ID' }]}
        itemCount={10}
      />,
    );

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
});
