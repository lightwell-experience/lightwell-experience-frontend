import { getMockAdvisoriesForLatestRelease } from './mockAdvisories';

describe('getMockAdvisoriesForLatestRelease', () => {
  it('stores each row CVE in aliases and upstream', () => {
    const advisories = getMockAdvisoriesForLatestRelease();

    expect(advisories.length).toBeGreaterThan(0);
    for (const advisory of advisories) {
      expect(advisory.upstream).toEqual(advisory.aliases);
      expect(advisory.aliases.some((id) => id.startsWith('CVE-'))).toBe(true);
      expect(advisory).not.toHaveProperty('advisory_name');
      expect(advisory).not.toHaveProperty('source');
    }
  });
});
