import { useMemo, useState } from 'react';

import type { AdvisoryRemediationEcosystem } from '../types';
import { countAdvisoryUpstreamVersions } from '../utils/advisories';

const toggleKey = (keys: Set<string>, key: string) => {
  const next = new Set(keys);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
};

export const useAdvisoryRemediationsTable = (remediations: AdvisoryRemediationEcosystem[]) => {
  const [search, setSearch] = useState('');
  const [ecosystemFilter, setEcosystemFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const [searchExpansion, setSearchExpansion] = useState<{
    key: string;
    collapsedRows: Set<string>;
  }>({ key: '', collapsedRows: new Set() });

  const term = search.trim().toLowerCase();
  const searchKey = JSON.stringify([term, ecosystemFilter]);
  const collapsedSearchRows =
    searchExpansion.key === searchKey ? searchExpansion.collapsedRows : null;

  const isRowExpanded = (key: string) =>
    term ? !collapsedSearchRows?.has(key) : expandedRows.has(key);

  const toggleRow = (key: string) => {
    if (term) {
      setSearchExpansion((previous) => ({
        key: searchKey,
        collapsedRows: toggleKey(
          previous.key === searchKey ? previous.collapsedRows : new Set<string>(),
          key,
        ),
      }));
    } else {
      setExpandedRows((previous) => toggleKey(previous, key));
    }
  };

  const visibleRemediations = useMemo(
    () =>
      remediations
        .filter((ecosystem) => !ecosystemFilter || ecosystem.name === ecosystemFilter)
        .map((ecosystem) => ({
          ...ecosystem,
          packages: ecosystem.packages
            .map((pkg) => {
              const series = pkg.series
                .map((series) => ({
                  ...series,
                  versions:
                    !term || pkg.name.toLowerCase().includes(term)
                      ? series.versions
                      : series.versions.filter(
                          (version) =>
                            version.upstreamVersion.toLowerCase().includes(term) ||
                            version.lightwellRelease.toLowerCase().includes(term),
                        ),
                }))
                .filter((series) => series.versions.length > 0);
              return {
                ...pkg,
                series,
                versionCount: countAdvisoryUpstreamVersions(series),
              };
            })
            .filter((pkg) => pkg.series.length > 0),
        }))
        .filter((ecosystem) => ecosystem.packages.length > 0),
    [remediations, ecosystemFilter, term],
  );

  const clearFilters = () => {
    setSearch('');
    setEcosystemFilter('');
  };

  return {
    search,
    setSearch,
    ecosystemFilter,
    setEcosystemFilter,
    visibleRemediations,
    isRowExpanded,
    toggleRow,
    clearFilters,
  };
};
