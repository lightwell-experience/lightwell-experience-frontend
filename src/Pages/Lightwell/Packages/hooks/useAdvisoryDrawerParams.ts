import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const ADVISORY_NAME_PARAM = 'name';

const getAdvisoryName = (searchParams: URLSearchParams): string =>
  searchParams.get(ADVISORY_NAME_PARAM)?.trim() ?? '';

const addAdvisoryNameToSearch = (searchParams: URLSearchParams, name: string): string => {
  const next = new URLSearchParams(searchParams);
  next.set(ADVISORY_NAME_PARAM, name);
  const query = next.toString();
  return query ? `?${query}` : '';
};

const removeAdvisoryNameFromSearch = (searchParams: URLSearchParams): URLSearchParams => {
  const next = new URLSearchParams(searchParams);
  next.delete(ADVISORY_NAME_PARAM);
  return next;
};

export const useAdvisoryDrawerParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const advisoryName = getAdvisoryName(searchParams);
  const isDrawerExpanded = Boolean(advisoryName);

  const closeDrawer = useCallback(() => {
    setSearchParams((currentParams) => removeAdvisoryNameFromSearch(currentParams), {
      replace: true,
    });
  }, [setSearchParams]);

  const getAdvisorySearch = useCallback(
    (name: string) => addAdvisoryNameToSearch(searchParams, name),
    [searchParams],
  );

  return {
    advisoryName,
    isDrawerExpanded,
    closeDrawer,
    getAdvisorySearch,
    replaceAdvisoryLink: isDrawerExpanded,
  };
};
