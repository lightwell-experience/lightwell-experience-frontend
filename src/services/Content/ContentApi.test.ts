import axios from 'axios';

import {
  getLightwellBrowserRepositories,
  getNpmPackageDetail,
  getNpmPackageVersions,
} from './ContentApi';

jest.mock('axios');

beforeEach(() => {
  jest.mocked(axios.get).mockReset();
});

it('encodes npm scopes and sends "-" for unscoped packages', async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { versions: [] } });

  await getNpmPackageVersions('repo', '@types', 'node');
  expect(axios.get).toHaveBeenLastCalledWith(
    '/api/content-sources/v1/repositories/repo/javascript_packages/%40types/node',
  );

  await getNpmPackageDetail('repo', '', 'express', '1.0.0+build');
  expect(axios.get).toHaveBeenLastCalledWith(
    '/api/content-sources/v1/repositories/repo/javascript_packages/-/express/1.0.0%2Bbuild',
  );
});

it('pages through the whole repository catalogue before the browser filters it', async () => {
  jest
    .mocked(axios.get)
    .mockResolvedValueOnce({ data: { data: [{ uuid: 'first' }], meta: { count: 2 }, links: {} } })
    .mockResolvedValueOnce({ data: { data: [{ uuid: 'second' }], meta: { count: 2 }, links: {} } });

  const result = await getLightwellBrowserRepositories({ feature_name: 'lightwell-network' });

  expect(result.data.map((repo) => repo.uuid)).toEqual(['first', 'second']);
  expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('offset=100'));
});

it('stops paging when a page comes back empty despite a larger reported count', async () => {
  jest
    .mocked(axios.get)
    .mockResolvedValueOnce({ data: { data: [{ uuid: 'only' }], meta: { count: 500 }, links: {} } })
    .mockResolvedValueOnce({ data: { data: [], meta: { count: 500 }, links: {} } });

  const result = await getLightwellBrowserRepositories({ feature_name: 'lightwell-network' });

  expect(result.data.map((repo) => repo.uuid)).toEqual(['only']);
  expect(axios.get).toHaveBeenCalledTimes(2);
});
