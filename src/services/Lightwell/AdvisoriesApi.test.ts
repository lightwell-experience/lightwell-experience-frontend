import axios from 'axios';

import { getLightwellAdvisories } from './AdvisoriesApi';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedGet = axios.get as jest.Mock;

const emptyPage = {
  data: {
    data: [],
    meta: { count: 0, limit: 200, offset: 0 },
  },
};

const requestedUrl = () => new URL(mockedGet.mock.calls[0][0] as string, 'http://localhost');

describe('getLightwellAdvisories', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockResolvedValue(emptyPage);
  });

  it('requests an exact cve_id and does not send name', async () => {
    await getLightwellAdvisories({
      repository: 'lightwell/java/remediated',
      package_name: 'org.json:json',
      package_version: '3.14.0',
      cve_id: 'CVE-2024-0001',
      latest_release: true,
    });

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/content-sources/v1/lightwell/advisories');
    expect(url.searchParams.get('cve_id')).toBe('CVE-2024-0001');
    expect(url.searchParams.get('package_name')).toBe('org.json:json');
    expect(url.searchParams.get('latest_release')).toBe('true');
    expect(url.searchParams.has('name')).toBe(false);
  });

  it('omits cve_id when the caller does not set one', async () => {
    await getLightwellAdvisories({ package_name: 'org.json:json' });

    const url = requestedUrl();
    expect(url.searchParams.has('cve_id')).toBe(false);
    expect(url.searchParams.has('name')).toBe(false);
  });
});
