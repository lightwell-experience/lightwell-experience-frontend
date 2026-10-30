import {
  validateManifestFile,
  getMaxFileSizeMB,
  toBytes,
  MAX_FILE_SIZE_MB,
  MAX_JAVA_FILE_SIZE_MB,
} from './validateManifestFile';

const fileWith = (name: string) => new File([''], name);

describe('validateManifestFile', () => {
  it.each([
    'pom.xml',
    'requirements.txt',
    'dev-requirements.txt',
    'test-requirements.txt',
    'inventory.csv',
    'bom.json',
    'bom.xml',
    'my-app.cdx.json',
    'my-app.cdx.xml',
    'my-app.pom',
    'my-app.spdx',
    'my-app.spdx.json',
    'my-app.spdx.tag',
    'sbom.json',
    'sbom.xml',
  ])('accepts %s', (name) => {
    expect(validateManifestFile(fileWith(name))).toBe(true);
  });

  it.each(['document.pdf', 'Dockerfile', 'not-pom.xml.bak', 'report.rdf', 'sbom.spdx.rdf'])(
    'rejects %s',
    (name) => {
      expect(validateManifestFile(fileWith(name))).toBe(false);
    },
  );
});

describe('getMaxFileSizeMB', () => {
  it.each(['dependency.pom', 'pom.xml'])('returns %i MB limit for %s', (name) => {
    expect(getMaxFileSizeMB(name)).toBe(MAX_JAVA_FILE_SIZE_MB);
  });

  it.each(['sbom.json', 'inventory.csv', 'my-app.spdx', 'requirements.txt'])(
    'returns %i MB limit for %s',
    (name) => {
      expect(getMaxFileSizeMB(name)).toBe(MAX_FILE_SIZE_MB);
    },
  );
});

describe('toBytes', () => {
  it('converts megabytes to bytes', () => {
    expect(toBytes(1)).toBe(1_048_576);
    expect(toBytes(10)).toBe(10_485_760);
    expect(toBytes(15)).toBe(15_728_640);
  });
});
