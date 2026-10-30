import { useQuery } from '@tanstack/react-query';

import { getCustomerIds } from './CustomerApi';

export const CUSTOMER_IDS_KEY = 'CUSTOMER_IDS_KEY';

export const useCustomerIdsQuery = () =>
  useQuery({
    queryKey: [CUSTOMER_IDS_KEY],
    queryFn: getCustomerIds,
    staleTime: Infinity,
    meta: {
      title: 'Error loading customer IDs',
      id: 'get-customer-ids-error',
    },
  });
