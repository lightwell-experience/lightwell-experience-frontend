import { useQuery } from '@tanstack/react-query';

import {
  getBeaconStatus,
  getLtwlsuptTicketIds,
  getVulnerabilities,
  type BeaconData,
  type BeaconPagination,
  type BeaconVulnerabilityFilters,
} from './BeaconApi';

export const BEACON_VULNERABILITIES_KEY = 'BEACON_VULNERABILITIES_KEY';
export const BEACON_LTWLSUPT_TICKET_IDS_KEY = 'BEACON_LTWLSUPT_TICKET_IDS_KEY';
export const BEACON_STATUS_KEY = 'BEACON_STATUS_KEY';

export type { BeaconData } from './BeaconApi';

export const useBeaconStatusQuery = () =>
  useQuery({
    queryKey: [BEACON_STATUS_KEY],
    queryFn: getBeaconStatus,
    staleTime: 20_000,
    meta: {
      title: 'Error loading beacon status',
      id: 'get-beacon-status-error',
    },
  });

export const useLtwlsuptTicketIdsQuery = (customerId?: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [BEACON_LTWLSUPT_TICKET_IDS_KEY, customerId],
    queryFn: () => getLtwlsuptTicketIds(customerId!),
    staleTime: 20_000,
    enabled: options?.enabled ?? Boolean(customerId),
    meta: {
      title: 'Error loading support ticket IDs',
      id: 'get-beacon-ltwlsupt-ticket-ids-error',
    },
  });

export const useBeaconVulnerabilitiesQuery = (
  customerId?: string,
  filters?: BeaconVulnerabilityFilters,
  pagination?: BeaconPagination,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [BEACON_VULNERABILITIES_KEY, customerId, filters, pagination],
    queryFn: async (): Promise<BeaconData> => getVulnerabilities(customerId!, filters, pagination),
    staleTime: 20_000,
    enabled: options?.enabled ?? Boolean(customerId),
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) {
        return undefined;
      }

      const previousCustomerId = previousQuery.queryKey[1];
      return previousCustomerId === customerId ? previousData : undefined;
    },
    meta: {
      title: 'Error loading beacon vulnerabilities',
      id: 'get-beacon-vulnerabilities-error',
    },
  });
