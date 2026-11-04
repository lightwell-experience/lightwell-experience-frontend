import {
  MAX_SUBMISSION_FILE_SIZE_MIB,
  toBytes,
  validateSubmissionFile,
} from './validateSubmissionFile';

const fileOfSize = (name: string, bytes: number): File => {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};

describe('validateSubmissionFile', () => {
  it('accepts a .json file within the size limit', () => {
    expect(validateSubmissionFile(fileOfSize('submission.json', 1024))).toBeUndefined();
  });

  it('accepts a .json file regardless of letter case', () => {
    expect(validateSubmissionFile(fileOfSize('Submission.JSON', 1024))).toBeUndefined();
  });

  it('rejects a file that is not .json', () => {
    expect(validateSubmissionFile(fileOfSize('report.yaml', 1024))).toBe(
      'Only .json files are accepted.',
    );
  });

  it('rejects a .json file that exceeds the size limit', () => {
    const tooBig = fileOfSize('submission.json', toBytes(MAX_SUBMISSION_FILE_SIZE_MIB) + 1);
    expect(validateSubmissionFile(tooBig)).toBe(
      `File exceeds the ${MAX_SUBMISSION_FILE_SIZE_MIB} MiB size limit. Please try a smaller file.`,
    );
  });

  it('accepts a .json file exactly at the size limit', () => {
    const atLimit = fileOfSize('submission.json', toBytes(MAX_SUBMISSION_FILE_SIZE_MIB));
    expect(validateSubmissionFile(atLimit)).toBeUndefined();
  });
});
