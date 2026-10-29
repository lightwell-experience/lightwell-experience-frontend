import { CodeIcon, JavaIcon, PythonIcon } from '@patternfly/react-icons';
import {
  formatDistributionUrl,
  formatPythonDisplayUrl,
  formatPythonIndexUrl,
  formatRepositoryName,
  getEcosystemFromContentType,
  getEcosystemIcon,
  getPackageByRepositoryDescription,
  getRepositoryDescription,
  getRepositoryNameFromPathSlug,
  getRepositoryPathSlug,
  hasBackportedFixes,
} from './helpers';
import {
  compareReleasesDesc,
  compareVersionsDesc,
  lightwellReleaseNum,
  pythonLightwellRelease,
  sortVersionsDesc,
  stripLightwellVersionSuffix,
} from './Packages/utils/versions';

describe('getEcosystemFromContentType', () => {
  it('returns the ecosystem for a known content type', () => {
    expect(getEcosystemFromContentType('maven')).toBe('Java');
    expect(getEcosystemFromContentType('python')).toBe('Python');
  });

  it('normalizes content type casing', () => {
    expect(getEcosystemFromContentType('MAVEN')).toBe('Java');
  });

  it('returns undefined for missing or unknown content type', () => {
    expect(getEcosystemFromContentType()).toBeUndefined();
    expect(getEcosystemFromContentType('unknown')).toBeUndefined();
  });
});

describe('getEcosystemIcon', () => {
  it('returns the icon for a known ecosystem or content type, regardless of case', () => {
    expect(getEcosystemIcon('JAVA').type).toBe(JavaIcon);
    expect(getEcosystemIcon('maven').type).toBe(JavaIcon);
    expect(getEcosystemIcon('MAVEN').type).toBe(JavaIcon);
    expect(getEcosystemIcon('Python').type).toBe(PythonIcon);
    expect(getEcosystemIcon('python').type).toBe(PythonIcon);
  });

  it('returns the generic icon for a missing or unknown ecosystem or content type', () => {
    expect(getEcosystemIcon().type).toBe(CodeIcon);
    expect(getEcosystemIcon('rust').type).toBe(CodeIcon);
    expect(getEcosystemIcon('npm').type).toBe(CodeIcon);
  });
});

describe('getRepositoryDescription', () => {
  it('returns a description for known content type and security level', () => {
    expect(getRepositoryDescription('maven', 'validated')).toBeDefined();
  });

  it('normalizes content type and security level casing', () => {
    expect(getRepositoryDescription('MAVEN', 'VALIDATED')).toEqual(
      getRepositoryDescription('maven', 'validated'),
    );
  });

  it('returns undefined when content type or security level is missing', () => {
    expect(getRepositoryDescription()).toBeUndefined();
    expect(getRepositoryDescription('maven')).toBeUndefined();
    expect(getRepositoryDescription(undefined, 'validated')).toBeUndefined();
  });

  it('returns a description for predisclosure security level', () => {
    expect(getRepositoryDescription('maven', 'predisclosure')).toBeDefined();
    expect(getRepositoryDescription('maven', 'predisclosure')).toBeTruthy();
  });
});

describe('getPackageByRepositoryDescription', () => {
  it('returns a description for known security level and content type', () => {
    expect(getPackageByRepositoryDescription('validated', 'maven')).toBeDefined();
    expect(getPackageByRepositoryDescription('remediated', 'python')).toBeDefined();
  });

  it('normalizes security level and content type casing', () => {
    expect(getPackageByRepositoryDescription('REMEDIATED', 'MAVEN')).toEqual(
      getPackageByRepositoryDescription('remediated', 'maven'),
    );
  });

  it('returns undefined when security level or content type is missing', () => {
    expect(getPackageByRepositoryDescription()).toBeUndefined();
    expect(getPackageByRepositoryDescription('remediated')).toBeUndefined();
    expect(getPackageByRepositoryDescription(undefined, 'maven')).toBeUndefined();
  });

  it('returns a description for predisclosure security level', () => {
    expect(getPackageByRepositoryDescription('predisclosure', 'maven')).toBeTruthy();
    expect(getPackageByRepositoryDescription('predisclosure', 'python')).toContain(
      'not yet publicly disclosed',
    );
  });

  it('uses the Maven release suffix for Maven backported-fix packages', () => {
    expect(getPackageByRepositoryDescription('remediated', 'maven')).toContain('.rhlw suffix');
    expect(getPackageByRepositoryDescription('predisclosure', 'maven')).toContain('.rhlw suffix');
  });

  it('uses the Python release suffix for Python backported-fix packages', () => {
    expect(getPackageByRepositoryDescription('remediated', 'python')).toContain('+rhlw suffix');
    expect(getPackageByRepositoryDescription('predisclosure', 'python')).toContain('+rhlw suffix');
  });

  it('describes validated packages as rebuilt from source without a release suffix', () => {
    const description = getPackageByRepositoryDescription('validated', 'maven');
    expect(description).toContain('rebuilt from source');
    expect(description).not.toContain('rhlw suffix');
  });
});

describe('hasBackportedFixes', () => {
  it('is true for remediated and predisclosure repositories', () => {
    expect(hasBackportedFixes('remediated')).toBe(true);
    expect(hasBackportedFixes('predisclosure')).toBe(true);
  });

  it('normalizes casing', () => {
    expect(hasBackportedFixes('Remediated')).toBe(true);
    expect(hasBackportedFixes('PREDISCLOSURE')).toBe(true);
  });

  it('is false for validated or missing security levels', () => {
    expect(hasBackportedFixes('validated')).toBe(false);
    expect(hasBackportedFixes()).toBe(false);
    expect(hasBackportedFixes('unknown')).toBe(false);
  });
});

describe('formatRepositoryName', () => {
  it('formats ecosystem and security level when both are available', () => {
    expect(formatRepositoryName('maven', 'validated')).toBe('Java Validated');
    expect(formatRepositoryName('python', 'remediated')).toBe('Python Remediated');
  });

  it('falls back to repository name when content type or security level is missing', () => {
    expect(formatRepositoryName(undefined, 'validated', 'fallback-repo')).toBe('fallback-repo');
    expect(formatRepositoryName('maven', undefined, 'fallback-repo')).toBe('fallback-repo');
  });

  it('returns dash when no formatted name or fallback is available', () => {
    expect(formatRepositoryName()).toBe('—');
  });

  it('formats predisclosure repository name correctly', () => {
    expect(formatRepositoryName('maven', 'predisclosure')).toBe('Java Predisclosure');
  });
});

describe('getRepositoryPathSlug', () => {
  it('creates a slug from ecosystem and security level', () => {
    expect(getRepositoryPathSlug('maven', 'validated')).toBe('java-validated');
    expect(getRepositoryPathSlug('python', 'remediated')).toBe('python-remediated');
  });

  it('returns empty string when content type or security level is missing', () => {
    expect(getRepositoryPathSlug()).toBe('');
    expect(getRepositoryPathSlug('maven')).toBe('');
    expect(getRepositoryPathSlug(undefined, 'validated')).toBe('');
  });

  it('creates a slug for predisclosure security level', () => {
    expect(getRepositoryPathSlug('maven', 'predisclosure')).toBe('java-predisclosure');
  });
});

describe('getRepositoryNameFromPathSlug', () => {
  it('converts a slug into a Lightwell repository name', () => {
    expect(getRepositoryNameFromPathSlug('java-validated')).toBe('lightwell/java/validated');
    expect(getRepositoryNameFromPathSlug('python-remediated')).toBe('lightwell/python/remediated');
  });

  it('returns empty string for invalid slugs', () => {
    expect(getRepositoryNameFromPathSlug('')).toBe('');
    expect(getRepositoryNameFromPathSlug('java')).toBe('');
    expect(getRepositoryNameFromPathSlug('-validated')).toBe('');
    expect(getRepositoryNameFromPathSlug('java-')).toBe('');
  });

  it('converts predisclosure slug into repository name', () => {
    expect(getRepositoryNameFromPathSlug('java-predisclosure')).toBe(
      'lightwell/java/predisclosure',
    );
  });
});

describe('stripLightwellVersionSuffix', () => {
  it('removes Lightwell release suffix from a version', () => {
    expect(stripLightwellVersionSuffix('1.2.3.rhlw-00001')).toBe('1.2.3');
  });

  it('returns the original version when no Lightwell suffix exists', () => {
    expect(stripLightwellVersionSuffix('1.2.3')).toBe('1.2.3');
  });

  it('separates a Python local release from its upstream version', () => {
    expect(stripLightwellVersionSuffix('3.0.1+rhlw.12')).toBe('3.0.1');
    expect(pythonLightwellRelease('3.0.1+rhlw.12')).toBe('+rhlw.12');
  });
});

describe('lightwellReleaseNum', () => {
  it('extracts release number from a release', () => {
    expect(lightwellReleaseNum('1.2.3.rhlw-00012')).toBe(12);
  });

  it('extracts release number from a release suffix', () => {
    expect(lightwellReleaseNum('rhlw-00007')).toBe(7);
    expect(lightwellReleaseNum('+rhlw.12')).toBe(12);
  });

  it('returns 0 when no trailing number exists', () => {
    expect(lightwellReleaseNum('rhlw')).toBe(0);
  });

  it('returns 0 when no Lightwell release or release exists', () => {
    expect(lightwellReleaseNum('1.2.3')).toBe(0);
  });
});

describe('sortVersionsDesc', () => {
  it('sorts dotted versions in descending numeric order', () => {
    expect(sortVersionsDesc(['1.10.2', '1.9.2', '1.11.1'])).toEqual(['1.11.1', '1.10.2', '1.9.2']);
  });
});

describe('compareVersionsDesc', () => {
  it('sorts Lightwell versions by base version descending', () => {
    const versions = ['1.9.1.rhlw-00001', '1.11.4.rhlw-00001', '1.10.1.rhlw-00001'];

    expect([...versions].sort(compareVersionsDesc)).toEqual([
      '1.11.4.rhlw-00001',
      '1.10.1.rhlw-00001',
      '1.9.1.rhlw-00001',
    ]);
  });

  it('treats versions with the same base version as equal', () => {
    expect(compareVersionsDesc('1.2.3.rhlw-00003', '1.2.3.rhlw-00002')).toBe(0);
  });
});

describe('compareReleasesDesc', () => {
  const release = (version: string, release: string) => ({
    version,
    release,
    created_at: '',
  });

  it('sorts releases by version descending first', () => {
    const releases = [
      release('1.2.2.rhlw-00009', 'rhlw-00009'),
      release('1.2.3.rhlw-00001', 'rhlw-00001'),
    ];

    expect([...releases].sort(compareReleasesDesc)).toEqual([
      release('1.2.3.rhlw-00001', 'rhlw-00001'),
      release('1.2.2.rhlw-00009', 'rhlw-00009'),
    ]);
  });

  it('uses release number as a tiebreaker when base versions match', () => {
    const releases = [
      release('1.2.2.rhlw-00008', 'rhlw-00008'),
      release('1.2.2.rhlw-00009', 'rhlw-00009'),
      release('1.2.2.rhlw-00003', 'rhlw-00003'),
    ];

    expect([...releases].sort(compareReleasesDesc)).toEqual([
      release('1.2.2.rhlw-00009', 'rhlw-00009'),
      release('1.2.2.rhlw-00008', 'rhlw-00008'),
      release('1.2.2.rhlw-00003', 'rhlw-00003'),
    ]);
  });
});

describe('formatDistributionUrl', () => {
  it('transforms Pulp API URL to Lightwell URL for production', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/lightwell/java/validated',
      ),
    ).toBe('https://packages.redhat.com/lightwell/java/validated/');
  });

  it('transforms Pulp API URL to Lightwell URL for stage', () => {
    expect(
      formatDistributionUrl(
        'https://packages.stage.redhat.com/api/pulp-content/lightwell/python/remediated/',
      ),
    ).toBe('https://packages.stage.redhat.com/lightwell/python/remediated/');
  });

  it('normalizes URLs without trailing slash', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/lightwell/python/validated',
      ),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/');
  });

  it('returns empty string unchanged', () => {
    expect(formatDistributionUrl('')).toBe('');
  });

  it('transforms demo Pulp API URL to Lightwell URL', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/public-lightwell-demo/python/validated/simple',
      ),
    ).toBe('https://packages.redhat.com/lightwell/public-lightwell-demo/python/validated/simple/');
  });

  it('transforms demo Pulp API URL to Lightwell URL with trailing slash', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/public-lightwell-demo/python/validated/simple/',
      ),
    ).toBe('https://packages.redhat.com/lightwell/public-lightwell-demo/python/validated/simple/');
  });

  it('returns URL unchanged if it does not contain the expected path', () => {
    expect(formatDistributionUrl('https://example.com/some/other/path')).toBe(
      'https://example.com/some/other/path',
    );
  });
});

describe('formatPythonIndexUrl', () => {
  it('appends /simple without a trailing slash', () => {
    expect(
      formatPythonIndexUrl(
        'https://packages.redhat.com/api/pulp-content/lightwell/python/validated',
      ),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/simple');
  });

  it('is idempotent when /simple or /simple/ is already present', () => {
    expect(
      formatPythonIndexUrl('https://packages.redhat.com/lightwell/python/validated/simple'),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/simple');
    expect(
      formatPythonIndexUrl('https://packages.redhat.com/lightwell/python/validated/simple/'),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/simple');
  });
});

describe('formatPythonDisplayUrl', () => {
  it('appends /simple with a trailing slash', () => {
    expect(
      formatPythonDisplayUrl(
        'https://packages.redhat.com/api/pulp-content/lightwell/python/validated',
      ),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/simple/');
  });

  it('is idempotent when /simple or /simple/ is already present', () => {
    expect(
      formatPythonDisplayUrl('https://packages.redhat.com/lightwell/python/validated/simple'),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/simple/');
    expect(
      formatPythonDisplayUrl('https://packages.redhat.com/lightwell/python/validated/simple/'),
    ).toBe('https://packages.redhat.com/lightwell/python/validated/simple/');
  });
});
