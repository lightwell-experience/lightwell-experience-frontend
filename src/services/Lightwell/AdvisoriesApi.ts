import axios from 'axios';

import { objectToUrlParams } from 'helpers';
import type { Links, Meta } from './types';

export const LIGHTWELL_ADVISORIES_PATH = '/api/content-sources/v1/lightwell/advisories';

// Fetch all advisories at once (~200 rows), revisit once the volume grows
// UI does not paginate because a single package version should return few advisories
const PAGE_SIZE = 200;

export type LightwellAdvisoryResponse = {
  advisory_id: string;
  advisory_name: string;
  severity: string;
  severity_score: number;
  summary: string;
  details: string;
  reference_urls: string[];
  // Includes the group prefix for Java packages
  package_name: string;
  package_version: string;
  fixed_versions: string[];
  repository: string;
  published: string | null;
  modified: string | null;
  aliases: string[];
  schema_version: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type LightwellAdvisoryFilters = {
  repository?: string;
  package_name?: string;
  package_version?: string;
  name?: string;
  severity_min?: string;
  latest_release?: boolean;
};

export type LightwellAdvisoryCollectionResponse = {
  data: LightwellAdvisoryResponse[];
  meta: Meta;
  links?: Links;
};

const buildAdvisoryQueryParams = (
  filters: LightwellAdvisoryFilters,
  pagination: Pick<Meta, 'limit' | 'offset'>,
) => ({
  repository: encodeURIComponent(filters.repository ?? ''),
  package_name: encodeURIComponent(filters.package_name ?? ''),
  package_version: encodeURIComponent(filters.package_version ?? ''),
  // The human-readable advisory name e.g., CVE-2026-0205
  name: encodeURIComponent(filters.name ?? ''),
  severity_min: encodeURIComponent(filters.severity_min ?? ''),
  latest_release: filters.latest_release,
  limit: String(pagination.limit),
  offset: String(pagination.offset),
});

export const getLightwellAdvisories = async (
  filters: LightwellAdvisoryFilters = {},
): Promise<LightwellAdvisoryCollectionResponse> => {
  const data: LightwellAdvisoryResponse[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  let meta: Meta = { count: 0, limit: PAGE_SIZE, offset: 0 };

  while (offset < total) {
    const { data: page } = await axios.get<LightwellAdvisoryCollectionResponse>(
      `${LIGHTWELL_ADVISORIES_PATH}?${objectToUrlParams(
        buildAdvisoryQueryParams(filters, { limit: PAGE_SIZE, offset }),
      )}`,
    );

    data.push(...page.data);
    meta = page.meta;
    total = page.meta.count;
    offset += page.data.length;

    if (page.data.length === 0) {
      break;
    }
  }

  return { data, meta: { ...meta, count: data.length } };
};
