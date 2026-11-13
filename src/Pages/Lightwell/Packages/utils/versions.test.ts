import {
  compareReleasesDesc,
  compareVersionsDesc,
  lightwellReleaseNum,
  sortNpmVersionsDesc,
  sortVersionsDesc,
  stripLightwellVersionSuffix,
  toLightwellRelease,
} from './versions';

describe('stripLightwellVersionSuffix', () => {
  it('removes Lightwell release suffix from a version', () => {
    expect(stripLightwellVersionSuffix('1.2.3.rhlw-00001')).toBe('1.2.3');
  });

  it('returns the original version when no Lightwell suffix exists', () => {
    expect(stripLightwellVersionSuffix('1.2.3')).toBe('1.2.3');
  });
});

describe('lightwellReleaseNum', () => {
  it('extracts release number from a release', () => {
    expect(lightwellReleaseNum('1.2.3.rhlw-00012')).toBe(12);
  });

  it('extracts release number from a release suffix', () => {
    expect(lightwellReleaseNum('rhlw-00007')).toBe(7);
  });

  it('returns 0 when no trailing number exists', () => {
    expect(lightwellReleaseNum('rhlw')).toBe(0);
  });

  it('returns 0 when no Lightwell release suffix exists', () => {
    expect(lightwellReleaseNum('1.2.3')).toBe(0);
  });
});

describe('sortVersionsDesc', () => {
  it('sorts dotted versions in descending numeric order', () => {
    expect(sortVersionsDesc(['1.10.2', '1.9.2', '1.11.1'])).toEqual(['1.11.1', '1.10.2', '1.9.2']);
  });

  it('orders release suffixes numerically, not lexically', () => {
    expect(
      sortVersionsDesc(['1.10.0.rhlw-00002', '1.9.9.rhlw-00099', '1.10.0.rhlw-00012']),
    ).toEqual(['1.10.0.rhlw-00012', '1.10.0.rhlw-00002', '1.9.9.rhlw-00099']);
    expect(sortVersionsDesc(['1.10.0+rhlw.2', '1.9.0+rhlw.10', '1.10.0+rhlw.12'])).toEqual([
      '1.10.0+rhlw.12',
      '1.10.0+rhlw.2',
      '1.9.0+rhlw.10',
    ]);
  });

  it('leaves the caller array untouched', () => {
    const versions = ['1.9.0', '1.11.0'];

    expect(sortVersionsDesc(versions)).toEqual(['1.11.0', '1.9.0']);
    expect(versions).toEqual(['1.9.0', '1.11.0']);
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

describe('toLightwellRelease', () => {
  it('joins Maven version and release with a dot', () => {
    expect(toLightwellRelease({ version: '5.3.18', release: 'rhlw-00007' })).toBe(
      '5.3.18.rhlw-00007',
    );
  });

  it('joins Python version and bare rhlw.N release with a plus', () => {
    expect(toLightwellRelease({ version: '0.23.1', release: 'rhlw.1' })).toBe('0.23.1+rhlw.1');
  });

  it('preserves an already-prefixed release suffix', () => {
    expect(toLightwellRelease({ version: '0.23.1', release: '+rhlw.1' })).toBe('0.23.1+rhlw.1');
    expect(toLightwellRelease({ version: '5.3.18', release: '.rhlw-00007' })).toBe(
      '5.3.18.rhlw-00007',
    );
  });
});

describe('sortNpmVersionsDesc', () => {
  it('ranks stable above prerelease and orders prerelease identifiers by SemVer precedence', () => {
    expect(
      sortNpmVersionsDesc([
        '1.0.0-alpha.2',
        '1.0.0-beta',
        '1.0.0',
        '1.0.0-alpha.10',
        '1.0.0-alpha',
        '2.0.0',
      ]),
    ).toEqual(['2.0.0', '1.0.0', '1.0.0-beta', '1.0.0-alpha.10', '1.0.0-alpha.2', '1.0.0-alpha']);
  });

  it('ranks numeric prerelease identifiers below alphanumeric ones', () => {
    expect(sortNpmVersionsDesc(['1.0.0-1', '1.0.0-alpha'])).toEqual(['1.0.0-alpha', '1.0.0-1']);
  });

  it('ignores build metadata when ranking', () => {
    // SemVer 11.2 excludes build metadata from precedence, so 1.0.0 and 1.0.0+build tie.
    // Only assert placement against versions they do not tie with.
    expect(sortNpmVersionsDesc(['1.0.0-rc.1', '1.0.0+build', '2.0.0'])).toEqual([
      '2.0.0',
      '1.0.0+build',
      '1.0.0-rc.1',
    ]);
  });
});
