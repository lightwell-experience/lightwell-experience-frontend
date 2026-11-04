import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const SUBMISSION_UUID_PARAM = 'submission';

const getSubmissionUuid = (searchParams: URLSearchParams): string =>
  searchParams.get(SUBMISSION_UUID_PARAM)?.trim() ?? '';

const addSubmissionUuidToSearch = (searchParams: URLSearchParams, uuid: string): string => {
  const next = new URLSearchParams(searchParams);
  next.set(SUBMISSION_UUID_PARAM, uuid);
  const query = next.toString();
  return query ? `?${query}` : '';
};

const removeSubmissionUuidFromSearch = (searchParams: URLSearchParams): URLSearchParams => {
  const next = new URLSearchParams(searchParams);
  next.delete(SUBMISSION_UUID_PARAM);
  return next;
};

/**
 * URL-param state for the submissions drawer, mirroring useAdvisoryDrawerParams:
 * the open submission is tracked in `?submission=<uuid>` so the drawer is
 * linkable and closing it replaces (rather than pushes) history.
 */
export const useSubmissionDrawerParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openUuid = getSubmissionUuid(searchParams);
  const isDrawerExpanded = Boolean(openUuid);

  const closeDrawer = useCallback(() => {
    setSearchParams((currentParams) => removeSubmissionUuidFromSearch(currentParams), {
      replace: true,
    });
  }, [setSearchParams]);

  const getSubmissionSearch = useCallback(
    (uuid: string) => addSubmissionUuidToSearch(searchParams, uuid),
    [searchParams],
  );

  const openSubmission = useCallback(
    (uuid: string) => {
      setSearchParams((currentParams) => {
        const next = new URLSearchParams(currentParams);
        next.set(SUBMISSION_UUID_PARAM, uuid);
        return next;
      });
    },
    [setSearchParams],
  );

  return {
    openUuid,
    isDrawerExpanded,
    closeDrawer,
    openSubmission,
    getSubmissionSearch,
    replaceSubmissionLink: isDrawerExpanded,
  };
};
