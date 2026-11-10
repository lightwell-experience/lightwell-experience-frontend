import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const SUBMISSION_UUID_PARAM = 'submission';
const SUBMISSION_TAB_PARAM = 'submissionTab';

export type SubmissionDrawerTab = 'reproducers' | 'packages';

const DEFAULT_SUBMISSION_TAB: SubmissionDrawerTab = 'reproducers';

const getSubmissionTab = (searchParams: URLSearchParams): SubmissionDrawerTab =>
  searchParams.get(SUBMISSION_TAB_PARAM) === 'packages' ? 'packages' : DEFAULT_SUBMISSION_TAB;

/** Store a non-default tab in the URL; the default tab is represented by no param. */
const setTabParam = (params: URLSearchParams, tab: SubmissionDrawerTab) => {
  if (tab === DEFAULT_SUBMISSION_TAB) params.delete(SUBMISSION_TAB_PARAM);
  else params.set(SUBMISSION_TAB_PARAM, tab);
};

const getSubmissionUuid = (searchParams: URLSearchParams): string =>
  searchParams.get(SUBMISSION_UUID_PARAM)?.trim() ?? '';

const addSubmissionUuidToSearch = (searchParams: URLSearchParams, uuid: string): string => {
  const next = new URLSearchParams(searchParams);
  next.set(SUBMISSION_UUID_PARAM, uuid);
  next.delete(SUBMISSION_TAB_PARAM);
  const query = next.toString();
  return query ? `?${query}` : '';
};

const removeSubmissionUuidFromSearch = (searchParams: URLSearchParams): URLSearchParams => {
  const next = new URLSearchParams(searchParams);
  next.delete(SUBMISSION_UUID_PARAM);
  next.delete(SUBMISSION_TAB_PARAM);
  return next;
};

/**
 * URL-param state for the submissions drawer, mirroring useAdvisoryDrawerParams:
 * the open submission is tracked in `?submission=<uuid>` so the drawer is
 * linkable and closing it replaces (rather than pushes) history. The active
 * drawer tab lives in `?submissionTab=` (absent for the default Reproducers tab).
 */
export const useSubmissionDrawerParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openUuid = getSubmissionUuid(searchParams);
  const isDrawerExpanded = Boolean(openUuid);
  const openTab = getSubmissionTab(searchParams);

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
    (uuid: string, tab: SubmissionDrawerTab = DEFAULT_SUBMISSION_TAB) => {
      setSearchParams((currentParams) => {
        const next = new URLSearchParams(currentParams);
        next.set(SUBMISSION_UUID_PARAM, uuid);
        setTabParam(next, tab);
        return next;
      });
    },
    [setSearchParams],
  );

  const setOpenTab = useCallback(
    (tab: SubmissionDrawerTab) => {
      setSearchParams(
        (currentParams) => {
          const next = new URLSearchParams(currentParams);
          setTabParam(next, tab);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    openUuid,
    isDrawerExpanded,
    closeDrawer,
    openSubmission,
    openTab,
    setOpenTab,
    getSubmissionSearch,
    replaceSubmissionLink: isDrawerExpanded,
  };
};
