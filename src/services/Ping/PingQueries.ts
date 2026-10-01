import { useQuery } from '@tanstack/react-query';

import { getPing } from './PingApi';

export const PING_QUERY_KEY = ['ping'] as const;

export const usePingQuery = () =>
  useQuery({
    queryKey: PING_QUERY_KEY,
    queryFn: getPing,
  });
