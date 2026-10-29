// Mirrors the backend's detectFormat + content-sniffing fallback:
// https://github.com/content-services/content-sources-backend/blob/main/pkg/coverage/parser/parser.go
const ACCEPTED_SUFFIXES = [
  '.csv',
  '.json',
  '.xml',
  '.pom',
  '.spdx',
  '.spdx.tag',
  'requirements.txt',
];

export const MAX_FILE_SIZE_MB = 15;
export const MAX_JAVA_FILE_SIZE_MB = 10;

export const getMaxFileSizeMB = (filename: string): number => {
  const lower = filename.toLowerCase();
  return lower.endsWith('.pom') || lower.endsWith('.xml')
    ? MAX_JAVA_FILE_SIZE_MB
    : MAX_FILE_SIZE_MB;
};

export const toBytes = (mb: number) => mb * 1024 * 1024;

export const validateManifestFile = (file: File): boolean => {
  const name = file.name.toLowerCase();
  return ACCEPTED_SUFFIXES.some((suffix) => name.endsWith(suffix));
};
