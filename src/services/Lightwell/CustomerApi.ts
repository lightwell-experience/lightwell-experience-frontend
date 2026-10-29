import axios from 'axios';

import { LIGHTWELL_BEACON_USE_MOCK } from 'Pages/Lightwell/constants';

const CUSTOMER_IDS_PATH = '/api/content-sources/v1/lightwell/beacon/vulnerabilities/customers/';
const MOCK_CUSTOMER_IDS = ['CID-01', 'CID-214'];

type LightwellCustomerIdsResponse = {
  data: string[];
};

export const getCustomerIds = async (): Promise<string[]> => {
  if (LIGHTWELL_BEACON_USE_MOCK) {
    return [...MOCK_CUSTOMER_IDS];
  }

  const { data } = await axios.get<LightwellCustomerIdsResponse>(CUSTOMER_IDS_PATH);
  return data.data ?? [];
};
