import { renderHook, act } from '@testing-library/react';
import { AlertVariant } from '@patternfly/react-core';

import { useBeaconExport } from './useBeaconExport';
import { getVulnerabilities } from 'services/Lightwell/BeaconApi';
import { buildBeaconPdfPayload } from '../pdf/beaconPdf';

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

jest.mock('../components/ExportMenu', () => ({
  fetchAllFilteredVulnerabilities: jest.fn(),
}));

jest.mock('Hooks/useErrorNotification', () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock('Hooks/useNotification', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../pdf/beaconPdf', () => ({
  buildBeaconPdfPayload: jest.fn(() => [{ module: './BeaconPdfEntry' }]),
}));

import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import useNotification from 'Hooks/useNotification';
import { fetchAllFilteredVulnerabilities } from '../components/ExportMenu';

const requestPdf = jest.fn().mockResolvedValue(undefined);
const notify = jest.fn();

const defaultProps = {
  customerId: 'CID-01',
  filters: undefined,
  visibleColumns: [{ key: 'vulnerabilityId' as const, title: 'Vulnerability ID' }],
  itemCount: 10,
};

beforeEach(() => {
  (useChrome as jest.Mock).mockReturnValue({ requestPdf });
  (useNotification as jest.Mock).mockReturnValue({ notify });
  requestPdf.mockReset();
  requestPdf.mockResolvedValue(undefined);
  notify.mockClear();
  (getVulnerabilities as jest.Mock).mockReset();
  (fetchAllFilteredVulnerabilities as jest.Mock).mockReset();
  (fetchAllFilteredVulnerabilities as jest.Mock).mockResolvedValue([]);
});

it('starts with isBusy false and the three export items', () => {
  const { result } = renderHook(() => useBeaconExport(defaultProps));

  expect(result.current.isBusy).toBe(false);
  expect(result.current.items.map((i) => i.id)).toEqual(['csv', 'json', 'pdf']);
});

it('items are not disabled while idle', () => {
  const { result } = renderHook(() => useBeaconExport(defaultProps));

  expect(result.current.items.every((i) => !i.isDisabled)).toBe(true);
});

it('requests a split PDF using crc-pdf-generator without fetching every row', async () => {
  const { result } = renderHook(() => useBeaconExport(defaultProps));

  await act(async () => {
    result.current.items.find((i) => i.id === 'pdf')!.onSelect?.();
  });

  expect(requestPdf).toHaveBeenCalledTimes(1);
  expect(fetchAllFilteredVulnerabilities).not.toHaveBeenCalled();
  const call = requestPdf.mock.calls[0][0];
  expect(call.filename).toBe('lightwell-beacon-CID-01.pdf');
  expect(call.payload).toEqual(
    buildBeaconPdfPayload({
      customerId: defaultProps.customerId,
      filters: defaultProps.filters,
      visibleColumns: defaultProps.visibleColumns,
      itemCount: defaultProps.itemCount,
    }),
  );
  expect(notify).toHaveBeenCalledWith(
    expect.objectContaining({ variant: AlertVariant.success, title: 'PDF ready' }),
  );
});

it('disables items and sets isBusy while a PDF export is in progress', async () => {
  let resolvePdf!: () => void;
  requestPdf.mockReturnValue(new Promise<void>((res) => (resolvePdf = res)));

  const { result } = renderHook(() => useBeaconExport(defaultProps));

  act(() => {
    result.current.items.find((i) => i.id === 'pdf')!.onSelect?.();
  });

  // Let the initial async state settle (notify + setIsExporting) without resolving pdf.
  await act(async () => {
    await Promise.resolve();
  });

  expect(result.current.isBusy).toBe(true);
  expect(result.current.items.every((i) => i.isDisabled)).toBe(true);
  expect(notify).toHaveBeenCalledWith(
    expect.objectContaining({ variant: AlertVariant.info, title: 'Generating PDF' }),
  );

  await act(async () => {
    resolvePdf();
  });

  expect(result.current.isBusy).toBe(false);
});

it('does nothing when customerId is absent', async () => {
  const { result } = renderHook(() => useBeaconExport({ ...defaultProps, customerId: undefined }));

  await act(async () => {
    result.current.items.find((i) => i.id === 'pdf')!.onSelect?.();
  });

  expect(requestPdf).not.toHaveBeenCalled();
});
