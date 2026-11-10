import type { LightwellAdvisoryResponse } from 'services/Lightwell/AdvisoriesApi';

import { toLatestReleaseFixes } from './useLatestReleaseFixes';

const advisory = (
  aliases: string[],
  severityScore: number,
  advisoryId = 'RHLW-2026-1',
): LightwellAdvisoryResponse =>
  ({
    advisory_id: advisoryId,
    aliases,
    upstream: aliases,
    severity_score: severityScore,
  }) as LightwellAdvisoryResponse;

describe('toLatestReleaseFixes', () => {
  it('counts each CVE once and keeps the higher severity score', () => {
    expect(
      toLatestReleaseFixes([
        advisory(['CVE-2024-0001', 'GHSA-1', 'CVE-2024-0002'], 8),
        advisory(['CVE-2024-0001', 'GHSA-2'], 9.4, 'RHLW-2026-2'),
        advisory(['GHSA-only'], 10, 'RHLW-2026-3'),
        advisory(['CVE-2024-0002', 'CVE-2024-0002'], 7.2, 'RHLW-2026-4'),
      ]),
    ).toEqual({
      total: 2,
      counts: { Critical: 1, Important: 1, Moderate: 0, Low: 0, None: 0 },
    });
  });

  it('counts a zero score as None', () => {
    expect(toLatestReleaseFixes([advisory(['CVE-2024-0001', 'GHSA-1'], 0)])).toEqual({
      total: 1,
      counts: { Critical: 0, Important: 0, Moderate: 0, Low: 0, None: 1 },
    });
  });
});
