import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { getLightwellRepositoryPackages } from './ContentApi';
import { useLightwellRepositoryPackagesQuery } from './ContentQueries';

jest.mock('./ContentApi');

const getPackages = getLightwellRepositoryPackages as jest.Mock;

const packagesResponse = {
  results: [
    {
      group: 'org.json.test',
      name: 'json-test',
      versions: ['1.0.0'],
      latest_releases: [],
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

const deferred = () => {
  let resolve: (value: typeof packagesResponse) => void = () => undefined;
  const promise = new Promise<typeof packagesResponse>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

type PackagesQueryProps = {
  uuid: string;
  page: number;
  search: string;
  sortBy?: string;
};

const renderPackagesQuery = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const initialProps: PackagesQueryProps = { uuid: 'repo-a', page: 1, search: '' };

  return renderHook(
    ({ uuid, page, search, sortBy }: PackagesQueryProps) =>
      useLightwellRepositoryPackagesQuery(uuid, page, 20, search, sortBy),
    { wrapper, initialProps },
  );
};

beforeEach(() => {
  getPackages.mockReset();
  getPackages.mockResolvedValue(packagesResponse);
});

it('keeps the previous rows while search or page is refetching', async () => {
  const { result, rerender } = renderPackagesQuery();

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const pending = deferred();
  getPackages.mockReturnValue(pending.promise);
  rerender({ uuid: 'repo-a', page: 1, search: 'json' });

  await waitFor(() => expect(result.current.isFetching).toBe(true));
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isPlaceholderData).toBe(true);
  expect(result.current.data?.results[0]?.name).toBe('json-test');

  pending.resolve(packagesResponse);
  await waitFor(() => expect(result.current.isFetching).toBe(false));

  const nextPage = deferred();
  getPackages.mockReturnValue(nextPage.promise);
  rerender({ uuid: 'repo-a', page: 2, search: 'json' });

  await waitFor(() => expect(result.current.isFetching).toBe(true));
  expect(result.current.isLoading).toBe(false);
  expect(result.current.data?.results[0]?.name).toBe('json-test');
});

it('does not keep packages from another repository', async () => {
  const { result, rerender } = renderPackagesQuery();

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  getPackages.mockReturnValue(deferred().promise);
  rerender({ uuid: 'repo-b', page: 1, search: '' });

  await waitFor(() => expect(result.current.isFetching).toBe(true));
  expect(result.current.isLoading).toBe(true);
  expect(result.current.data).toBeUndefined();
});

it('sends sort_by and keeps rows while a sort refetch is in flight', async () => {
  const { result, rerender } = renderPackagesQuery();

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(getPackages).toHaveBeenCalledWith('repo-a', 1, 20, '', undefined);

  const pending = deferred();
  getPackages.mockReturnValue(pending.promise);
  rerender({ uuid: 'repo-a', page: 1, search: '', sortBy: 'last_updated:desc' });

  await waitFor(() => expect(result.current.isFetching).toBe(true));
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isPlaceholderData).toBe(true);
  expect(result.current.data?.results[0]?.name).toBe('json-test');
  expect(getPackages).toHaveBeenCalledWith('repo-a', 1, 20, '', 'last_updated:desc');
});
