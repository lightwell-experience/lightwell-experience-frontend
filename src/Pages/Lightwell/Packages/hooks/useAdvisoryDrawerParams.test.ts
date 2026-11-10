import { act, renderHook } from '@testing-library/react';

import { useAdvisoryDrawerParams } from './useAdvisoryDrawerParams';

const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
}));

import { useSearchParams } from 'react-router-dom';

const mockSearchParams = (query = '') => {
  const searchParams = new URLSearchParams(query);
  (useSearchParams as jest.Mock).mockReturnValue([searchParams, mockSetSearchParams]);
  return searchParams;
};

beforeEach(() => {
  mockSetSearchParams.mockClear();
  mockSearchParams();
});

it('is closed when the cve_id param is missing', () => {
  const { result } = renderHook(() => useAdvisoryDrawerParams());

  expect(result.current.advisoryName).toBe('');
  expect(result.current.isDrawerExpanded).toBe(false);
  expect(result.current.replaceAdvisoryLink).toBe(false);
});

it('adds the cve_id to search while preserving other params', () => {
  const searchParams = mockSearchParams('cve_id=%20CVE-2022-40152%20&search=json');

  const { result } = renderHook(() => useAdvisoryDrawerParams());

  expect(result.current.advisoryName).toBe('CVE-2022-40152');
  expect(result.current.isDrawerExpanded).toBe(true);
  expect(result.current.replaceAdvisoryLink).toBe(true);
  expect(result.current.getAdvisorySearch('CVE-2022-40151')).toBe(
    '?cve_id=CVE-2022-40151&search=json',
  );
  expect(searchParams.toString()).toBe('cve_id=+CVE-2022-40152+&search=json');
});

it('removes the cve_id from search on close while preserving other params', () => {
  mockSearchParams('cve_id=CVE-2022-40152&search=json');

  const { result } = renderHook(() => useAdvisoryDrawerParams());

  act(() => {
    result.current.closeDrawer();
  });

  expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function), { replace: true });

  const updater = mockSetSearchParams.mock.calls[0][0] as (
    params: URLSearchParams,
  ) => URLSearchParams;

  const currentParams = new URLSearchParams('cve_id=CVE-2022-40152&search=json');
  expect(updater(currentParams).toString()).toBe('search=json');
  expect(currentParams.toString()).toBe('cve_id=CVE-2022-40152&search=json');
});

it('opens a legacy name link and prefers cve_id when both are present', () => {
  mockSearchParams('name=CVE-2022-40152&search=json');
  const legacy = renderHook(() => useAdvisoryDrawerParams());
  expect(legacy.result.current.advisoryName).toBe('CVE-2022-40152');
  expect(legacy.result.current.isDrawerExpanded).toBe(true);
  expect(legacy.result.current.getAdvisorySearch('CVE-2022-40151')).toBe(
    '?search=json&cve_id=CVE-2022-40151',
  );

  mockSearchParams('name=CVE-2022-40151&cve_id=CVE-2022-40152');
  const current = renderHook(() => useAdvisoryDrawerParams());
  expect(current.result.current.advisoryName).toBe('CVE-2022-40152');
});

it('removes a legacy name param when the drawer closes', () => {
  mockSearchParams('name=CVE-2022-40152&search=json');
  const { result } = renderHook(() => useAdvisoryDrawerParams());

  act(() => {
    result.current.closeDrawer();
  });

  const updater = mockSetSearchParams.mock.calls[0][0] as (
    params: URLSearchParams,
  ) => URLSearchParams;
  expect(
    updater(
      new URLSearchParams('name=CVE-2022-40152&cve_id=CVE-2022-40151&search=json'),
    ).toString(),
  ).toBe('search=json');
});
