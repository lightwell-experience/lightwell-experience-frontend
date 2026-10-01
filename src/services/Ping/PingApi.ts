import axios from 'axios';

import { API_BASE, USE_CS } from '../../constants';

export const getPing = async (): Promise<string> => {
  // CS has no public /ping under the versioned API, uses /features to verify connectivity
  if (USE_CS) {
    await axios.get('/api/content-sources/v1.0/features/');
    return 'content-sources ok';
  }

  await axios.get(`${API_BASE}/ping`);
  return 'lightwell-experience ok';
};
