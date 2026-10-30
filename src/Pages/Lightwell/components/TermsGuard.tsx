import { type ReactNode, useEffect, useRef } from 'react';

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useQueryClient } from '@tanstack/react-query';

import Loader from 'components/Loader';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { TERMS_REQUIRED_KEY, useTermsRequired } from 'services/Lightwell/TermsQueries';

export function buildTermsUrl(
  termsHost: string,
  currentUrl: string,
  site: string,
  events: string[],
): string {
  const returnUrl = encodeURIComponent(currentUrl);
  const eventParams = events.map((e) => `event=${encodeURIComponent(e)}`).join('&');
  return `${termsHost}/wapps/tnc/ackrequired?site=${encodeURIComponent(site)}&${eventParams}&redirect=${returnUrl}`;
}

interface TermsGuardProps {
  children: ReactNode;
}

export default function TermsGuard({ children }: TermsGuardProps) {
  const { data, isLoading, isError } = useTermsRequired();
  const { getEnvironment } = useChrome();
  const queryClient = useQueryClient();
  const redirecting = useRef(false);

  const termsHost =
    getEnvironment() === 'prod' ? 'https://www.redhat.com' : 'https://www.stage.redhat.com';

  const canRedirect = data?.required && data.site && !!data.events?.length;

  useEffect(() => {
    if (!isLoading && !isError && canRedirect && !redirecting.current) {
      redirecting.current = true;
      window.location.href = buildTermsUrl(
        termsHost,
        window.location.href,
        data.site!,
        data.events!,
      );
    }
  }, [isLoading, isError, canRedirect, data, termsHost]);

  if (isLoading || (canRedirect && !isError)) {
    return <Loader />;
  }

  if (isError) {
    return (
      <EmptyState
        headingLevel='h4'
        icon={ExclamationCircleIcon}
        titleText='Service temporarily unavailable'
        variant={EmptyStateVariant.lg}
      >
        <EmptyStateBody>
          We are unable to verify your terms acceptance right now. Please try again in a few
          minutes.
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant='primary'
              onClick={() => queryClient.invalidateQueries({ queryKey: [TERMS_REQUIRED_KEY] })}
            >
              Try again
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  return <>{children}</>;
}
