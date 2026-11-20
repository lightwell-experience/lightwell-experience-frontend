// Clearinghouse intake accepts a single JSON or CSV file. Either way the backend
// stores it as submission.json (a CSV is converted to the intake JSON first).
// Mirrors the backend's per-file 50 MiB limit.
export const MAX_SUBMISSION_FILE_SIZE_MIB = 50;

export const ACCEPTED_SUBMISSION_EXTENSIONS = ['.json', '.csv'];

export const toBytes = (mib: number) => mib * 1024 * 1024;

/** Returns an error message for an invalid file, or undefined when the file is accepted. */
export const validateSubmissionFile = (file: File): string | undefined => {
  if (!ACCEPTED_SUBMISSION_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return 'Only .json or .csv files are accepted.';
  }

  if (file.size > toBytes(MAX_SUBMISSION_FILE_SIZE_MIB)) {
    return `File exceeds the ${MAX_SUBMISSION_FILE_SIZE_MIB} MiB size limit. Please try a smaller file.`;
  }

  return undefined;
};
