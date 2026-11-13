import { act, renderHook } from '@testing-library/react';

import { useSubmissionDrawerParams } from './useSubmissionDrawerParams';

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

it('is closed when the submission param is missing', () => {
  const { result } = renderHook(() => useSubmissionDrawerParams());

  expect(result.current.openUuid).toBe('');
  expect(result.current.isDrawerExpanded).toBe(false);
  expect(result.current.replaceSubmissionLink).toBe(false);
});

it('adds the submission uuid to search while preserving other params', () => {
  const searchParams = mockSearchParams('submission=%20sub-1%20&page=2');

  const { result } = renderHook(() => useSubmissionDrawerParams());

  expect(result.current.openUuid).toBe('sub-1');
  expect(result.current.isDrawerExpanded).toBe(true);
  expect(result.current.replaceSubmissionLink).toBe(true);
  expect(result.current.getSubmissionSearch('sub-2')).toBe('?submission=sub-2&page=2');
  expect(searchParams.toString()).toBe('submission=+sub-1+&page=2');
});

it('opens a submission by setting the submission uuid param (pushing history)', () => {
  mockSearchParams('page=2');

  const { result } = renderHook(() => useSubmissionDrawerParams());

  act(() => {
    result.current.openSubmission('sub-9');
  });

  expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function));

  const updater = mockSetSearchParams.mock.calls[0][0] as (
    params: URLSearchParams,
  ) => URLSearchParams;

  expect(updater(new URLSearchParams('page=2')).toString()).toBe('page=2&submission=sub-9');
});

it('removes the submission uuid from search on close while preserving other params', () => {
  mockSearchParams('submission=sub-1&page=2');

  const { result } = renderHook(() => useSubmissionDrawerParams());

  act(() => {
    result.current.closeDrawer();
  });

  expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function), { replace: true });

  const updater = mockSetSearchParams.mock.calls[0][0] as (
    params: URLSearchParams,
  ) => URLSearchParams;

  const currentParams = new URLSearchParams('submission=sub-1&page=2');
  expect(updater(currentParams).toString()).toBe('page=2');
  expect(currentParams.toString()).toBe('submission=sub-1&page=2');
});

describe('drawer tab', () => {
  const lastUpdater = () =>
    mockSetSearchParams.mock.calls.at(-1)![0] as (params: URLSearchParams) => URLSearchParams;

  it('defaults to the reproducers tab', () => {
    mockSearchParams('submission=sub-1');
    const { result } = renderHook(() => useSubmissionDrawerParams());
    expect(result.current.openTab).toBe('reproducers');
  });

  it('reads the packages tab from the URL', () => {
    mockSearchParams('submission=sub-1&submissionTab=packages');
    const { result } = renderHook(() => useSubmissionDrawerParams());
    expect(result.current.openTab).toBe('packages');
  });

  it('opens a submission on a given tab', () => {
    const { result } = renderHook(() => useSubmissionDrawerParams());
    act(() => result.current.openSubmission('sub-9', 'packages'));
    expect(lastUpdater()(new URLSearchParams()).toString()).toBe(
      'submission=sub-9&submissionTab=packages',
    );
  });

  it('drops a stale tab when opening a submission on the default tab', () => {
    const { result } = renderHook(() => useSubmissionDrawerParams());
    act(() => result.current.openSubmission('sub-9'));
    expect(lastUpdater()(new URLSearchParams('submissionTab=packages')).toString()).toBe(
      'submission=sub-9',
    );
  });

  it('switches tabs replacing history', () => {
    const { result } = renderHook(() => useSubmissionDrawerParams());
    act(() => result.current.setOpenTab('packages'));
    expect(mockSetSearchParams).toHaveBeenLastCalledWith(expect.any(Function), { replace: true });
    expect(lastUpdater()(new URLSearchParams('submission=sub-1')).toString()).toBe(
      'submission=sub-1&submissionTab=packages',
    );
    act(() => result.current.setOpenTab('reproducers'));
    expect(
      lastUpdater()(new URLSearchParams('submission=sub-1&submissionTab=packages')).toString(),
    ).toBe('submission=sub-1');
  });

  it('clears the tab when closing or linking to another submission', () => {
    const searchParams = mockSearchParams('submission=sub-1&submissionTab=packages');
    const { result } = renderHook(() => useSubmissionDrawerParams());
    expect(result.current.getSubmissionSearch('sub-2')).toBe('?submission=sub-2');
    act(() => result.current.closeDrawer());
    expect(lastUpdater()(searchParams).toString()).toBe('');
  });
});
