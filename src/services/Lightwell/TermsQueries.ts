import { useQuery } from '@tanstack/react-query';

import { getTermsRequired } from './TermsApi';

export const TERMS_REQUIRED_KEY = 'TERMS_REQUIRED_KEY';

export const useTermsRequired = () =>
  useQuery({
    queryKey: [TERMS_REQUIRED_KEY],
    queryFn: getTermsRequired,
    staleTime: 60_000,
  });
