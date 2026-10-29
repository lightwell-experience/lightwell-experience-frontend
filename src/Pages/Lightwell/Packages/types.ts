import type { AdvisorySeverity } from './utils/severity';

export type PackageCoordinate = { name: string; group?: string } & (
  { isMaven: boolean; isPython?: never } | { isPython: boolean; isMaven?: never }
);

export type PackageAdvisoryRemediation = {
  advisoryName: string;
  severity: AdvisorySeverity;
  lightwellRelease: string;
  isLatest: boolean;
};

export type AdvisoryRemediationVersion = {
  upstreamVersion: string;
  lightwellRelease: string;
};

export type AdvisoryRemediationSeries = {
  name: string;
  versions: AdvisoryRemediationVersion[];
};

export type AdvisoryRemediationPackage = {
  name: string;
  versionCount: number;
  series: AdvisoryRemediationSeries[];
};

export type AdvisoryRemediationEcosystem = {
  name: string;
  packages: AdvisoryRemediationPackage[];
};

export type AdvisoryDetails = {
  advisoryName: string;
  counts: {
    packages: number;
    upstreamVersions: number;
    ecosystems: number;
  };
  overview: {
    severity: AdvisorySeverity;
    cvssScore: string;
    aliases: string[];
    released: string;
    lastUpdated: string;
    summary: string;
    details: string;
  };
  remediations: AdvisoryRemediationEcosystem[];
  osv: {
    schemaVersion: string;
    source: string;
    published: string;
    lastUpdated: string;
    recordId: string;
  };
};

export type PreferredAdvisoryRecord = {
  repository: string;
  packageName: string;
  packageVersion: string;
};

export type AdvisoryFlatRemediation = AdvisoryRemediationVersion & {
  ecosystem: string;
  packageName: string;
};
