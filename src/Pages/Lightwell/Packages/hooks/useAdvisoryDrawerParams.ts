import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const CVE_ID_PARAM = 'cve_id';
const LEGACY_ADVISORY_NAME_PARAM = 'name';

const readSearchParam = (searchParams: URLSearchParams, key: string): string =>
  searchParams.get(key)?.trim() ?? '';

const getAdvisoryName = (searchParams: URLSearchParams): string =>
  readSearchParam(searchParams, CVE_ID_PARAM) ||
  readSearchParam(searchParams, LEGACY_ADVISORY_NAME_PARAM);

const addAdvisoryNameToSearch = (searchParams: URLSearchParams, cveId: string): string => {
  const next = new URLSearchParams(searchParams);
  next.delete(LEGACY_ADVISORY_NAME_PARAM);
  next.set(CVE_ID_PARAM, cveId);
  const query = next.toString();
  return query ? `?${query}` : '';
};

const removeAdvisoryNameFromSearch = (searchParams: URLSearchParams): URLSearchParams => {
  const next = new URLSearchParams(searchParams);
  next.delete(CVE_ID_PARAM);
  next.delete(LEGACY_ADVISORY_NAME_PARAM);
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
