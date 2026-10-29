import { act, renderHook, waitFor } from '@testing-library/react';

import { useLightwellPackagesParams } from './useLightwellPackagesParams';

const mockSetSearchParams = jest.fn();
let mockNavigationType: 'POP' | 'PUSH' | 'REPLACE' = 'REPLACE';

jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
  useNavigationType: jest.fn(() => mockNavigationType),
}));

jest.mock('Hooks/useDebounce', () => (value: string) => value);

import { useSearchParams } from 'react-router-dom';

const mockSearchParams = (query = '') => {
  const searchParams = new URLSearchParams(query);
  (useSearchParams as jest.Mock).mockReturnValue([searchParams, mockSetSearchParams]);
  return searchParams;
};

beforeEach(() => {
  mockNavigationType = 'REPLACE';
  mockSetSearchParams.mockClear();
  mockSearchParams();
});

it('initializes from URL search params', () => {
  mockSearchParams('search=test&page=2');

  const { result } = renderHook(() => useLightwellPackagesParams());

  expect(result.current.searchQuery).toBe('test');
  expect(result.current.debouncedSearch).toBe('test');
  expect(result.current.page).toBe(2);
  expect(result.current.sortBy).toBe('last_updated');
  expect(result.current.sortDirection).toBe('desc');
  expect(result.current.packagesParams).toEqual({
    search: 'test',
    page: 2,
    sortBy: 'last_updated',
    sortDirection: 'desc',
  });
});

it('resets page to 1 when search changes', async () => {
  mockSearchParams('search=test1&page=3');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setSearchQuery('test2');
  });

  await waitFor(() => {
    expect(result.current.page).toBe(1);
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test2'), {
      replace: true,
    });
  });
});

it('updates the URL params when search changes', async () => {
  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setSearchQuery('test');
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test'), {
      replace: true,
    });
  });
});

it('updates the URL params when page changes', async () => {
  mockSearchParams('search=test&page=1');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setPage(3);
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test&page=3'), {
      replace: true,
    });
  });
});

it('clears the URL params when search is cleared', async () => {
  mockSearchParams('search=test&page=2');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setSearchQuery('');
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams(), { replace: true });
  });
});

it('defaults invalid page param from the URL to 1', async () => {
  mockSearchParams('search=test&page=abc');

  const { result } = renderHook(() => useLightwellPackagesParams());

  expect(result.current.searchQuery).toBe('test');
  expect(result.current.debouncedSearch).toBe('test');
  expect(result.current.page).toBe(1);
  expect(result.current.sortBy).toBe('last_updated');
  expect(result.current.sortDirection).toBe('desc');
  expect(result.current.packagesParams).toEqual({
    search: 'test',
    page: 1,
    sortBy: 'last_updated',
    sortDirection: 'desc',
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test'), {
      replace: true,
    });
  });
});

it('initializes sort from the URL and keeps the page', () => {
  mockSearchParams('search=json&sort_by=name:asc&page=2');

  const { result } = renderHook(() => useLightwellPackagesParams());

  expect(result.current.sortBy).toBe('name');
  expect(result.current.sortDirection).toBe('asc');
  expect(result.current.page).toBe(2);
  expect(result.current.packagesParams).toEqual({
    search: 'json',
    page: 2,
    sortBy: 'name',
    sortDirection: 'asc',
  });
  expect(mockSetSearchParams).not.toHaveBeenCalled();
});

it('writes the sort to the URL and resets the page', async () => {
  mockSearchParams('search=test&page=3');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.onSort('last_updated', 'asc');
  });

  expect(result.current.page).toBe(1);
  expect(result.current.packagesParams).toEqual({
    search: 'test',
    page: 1,
    sortBy: 'last_updated',
    sortDirection: 'asc',
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      new URLSearchParams('search=test&sort_by=last_updated:asc'),
      { replace: true },
    );
  });
});

it('omits the default last updated descending sort from the URL', async () => {
  mockSearchParams('sort_by=last_updated:desc&search=test');

  renderHook(() => useLightwellPackagesParams());

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test'), {
      replace: true,
    });
  });
});

it('drops an invalid sort param and keeps the rest of the URL', async () => {
  mockSearchParams('sort_by=version:asc&search=test&page=2');

  const { result } = renderHook(() => useLightwellPackagesParams());

  expect(result.current.sortBy).toBe('last_updated');
  expect(result.current.sortDirection).toBe('desc');
  expect(result.current.page).toBe(2);

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test&page=2'), {
      replace: true,
    });
  });
});

it('applies a back-navigation sort before writing the URL', async () => {
  mockNavigationType = 'POP';
  mockSearchParams('sort_by=name:asc&page=2');

  const { result, rerender } = renderHook(() => useLightwellPackagesParams());

  mockSetSearchParams.mockClear();
  mockSearchParams('sort_by=last_updated:asc');
  rerender();

  expect(result.current.sortBy).toBe('last_updated');
  expect(result.current.sortDirection).toBe('asc');
  expect(result.current.page).toBe(1);
  expect(mockSetSearchParams).not.toHaveBeenCalled();

  act(() => {
    result.current.onSort('name', 'desc');
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('sort_by=name:desc'), {
      replace: true,
    });
  });
});
