import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
  getLightwellAdvisories,
  type LightwellAdvisoryResponse,
} from 'services/Lightwell/AdvisoriesApi';
import { useAdvisoryDetails } from './useAdvisoryDetails';

jest.mock('services/Lightwell/AdvisoriesApi', () => ({
  LIGHTWELL_ADVISORIES_PATH: '/api/content-sources/v1/lightwell/advisories',
  getLightwellAdvisories: jest.fn(),
}));

const mockedGetAdvisories = getLightwellAdvisories as jest.Mock;

const advisory = (
  overrides: Partial<LightwellAdvisoryResponse> &
    Pick<LightwellAdvisoryResponse, 'advisory_id' | 'aliases'>,
): LightwellAdvisoryResponse => {
  const aliases = overrides.aliases;

  return {
    severity: '7.5',
    severity_score: 7.5,
    summary: 'summary',
    details: 'details',
    reference_urls: [],
    package_name: 'org.json:json',
    package_version: '3.14.0',
    fixed_versions: ['3.14.0.rhlw-00001'],
    repository: 'lightwell/java/remediated',
    published: '2026-01-01T00:00:00Z',
    modified: '2026-02-01T00:00:00Z',
    schema_version: '1.6.0',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
    aliases,
    upstream: overrides.upstream ?? aliases,
  };
};

describe('useAdvisoryDetails', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockedGetAdvisories.mockReset();
  });

  it('requests cve_id and keeps rows whose aliases contain that CVE', async () => {
    mockedGetAdvisories.mockResolvedValue({
      data: [
        advisory({
          advisory_id: 'RHLW-2026-page',
          aliases: ['CVE-2024-0001', 'GHSA-1'],
          summary: 'page summary',
          package_name: 'org.json:json',
          package_version: '3.14.0',
        }),
        advisory({
          advisory_id: 'RHLW-2026-other',
          aliases: ['CVE-2024-9999'],
          summary: 'other summary',
          package_name: 'org.other:lib',
          package_version: '1.0.0',
        }),
      ],
      meta: { count: 2, limit: 200, offset: 0 },
    });

    const { result } = renderHook(
      () =>
        useAdvisoryDetails('CVE-2024-0001', {
          preferredRecord: {
            repository: 'lightwell/java/remediated',
            packageName: 'org.json:json',
            packageVersion: '3.14.0',
          },
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data?.advisoryName).toBe('CVE-2024-0001'));
    expect(mockedGetAdvisories).toHaveBeenCalledWith({ cve_id: 'CVE-2024-0001' });
    expect(result.current.data?.overview.summary).toBe('page summary');
    expect(result.current.data?.counts.packages).toBe(1);
    expect(result.current.data?.osv.recordId).toBe('RHLW-2026-page');
  });
});
