import axios from 'axios';

import { API_BASE, USE_CS } from '../../constants';

export const getPing = async (): Promise<string> => {
  // CS has no public /ping or /status under the versioned API, uses /features to verify connectivity
  if (USE_CS) {
    await axios.get(`${API_BASE}/features/`);
    return 'content-sources ok';
  }

  await axios.get(`${API_BASE}/status`);
  return 'lightwell-experience ok';
};
