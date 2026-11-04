import axios from 'axios';

import { Links, Meta } from './types';

export const CLEARINGHOUSE_SUBMISSIONS_PATH = '/api/lightwell/v0.1/clearinghouse/submissions';

export type SubmissionStatus = 'pending' | 'submitted' | 'processed';

export type ClearinghouseSubmissionFile = {
  uuid: string;
  filename: string;
  // Author of this file (backend field `username`).
  username: string;
  created_at: string;
  // True for the main report file; the rest are reproducers.
  submission?: boolean;
};

export type ClearinghouseSubmission = {
  uuid: string;
  status: SubmissionStatus;
  created_at: string;
  // Author of the submission (backend field `username`).
  username: string;
  // Original uploaded report name (e.g. "RHOSE-4.9.json"); stored as submission.json.
  name?: string;
  org_id?: string;
  files?: ClearinghouseSubmissionFile[];
  vulnerability_count?: number;
  error_message?: string;
  // Recorded when the author finalizes the submission (`pending` → `submitted`).
  submitted_at?: string;
  submitted_by?: string;
  processed_at?: string;
  processed_by?: string;
};

export type ClearinghouseSubmissionListResponse = {
  data: ClearinghouseSubmission[];
  meta: Meta;
  links: Links;
};

/** Read a file's contents as text (File.text() isn't available in all environments). */
const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

/**
 * Create a pending submission from a single JSON file. The file's contents are
 * posted as the JSON request body with the uploaded filename added as a top-level
 * `name`; the backend returns the new submission's metadata, including the author's
 * username.
 */
export const createSubmission = async (file: File): Promise<ClearinghouseSubmission> => {
  const contents = await readFileAsText(file);
  const payload = { ...JSON.parse(contents), name: file.name };

  const { data } = await axios.post<ClearinghouseSubmission>(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/create`,
    payload,
  );
  return data;
};

/** List submissions for the org. File contents are not included. */
export const listSubmissions = async (
  limit = 100,
  offset = 0,
): Promise<ClearinghouseSubmissionListResponse> => {
  const { data } = await axios.get<ClearinghouseSubmissionListResponse>(
    CLEARINGHOUSE_SUBMISSIONS_PATH,
    { params: { limit, offset } },
  );
  return data;
};

/** Fetch a single submission by uuid. File contents are not included. */
export const getSubmission = async (uuid: string): Promise<ClearinghouseSubmission> => {
  const { data } = await axios.get<ClearinghouseSubmission>(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}`,
  );
  return data;
};

/** Add one or more files (e.g. reproducers) to a pending submission. */
export const addSubmissionFiles = async (
  uuid: string,
  files: File[],
): Promise<ClearinghouseSubmission> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await axios.post<ClearinghouseSubmission>(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}/files`,
    formData,
  );
  return data;
};

/**
 * Delete a single file from a pending submission. Deleting `submission.json`
 * removes the whole submission.
 */
export const deleteSubmissionFile = async (uuid: string, filename: string): Promise<void> => {
  await axios.delete(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}/files/${encodeURIComponent(filename)}`,
  );
};

/** Delete a whole pending submission and all of its files. */
export const deleteSubmission = async (uuid: string): Promise<void> => {
  await axios.delete(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}`);
};

/** Finalize a pending submission (`pending` → `submitted`). */
export const submitSubmission = async (uuid: string): Promise<ClearinghouseSubmission> => {
  const { data } = await axios.post<ClearinghouseSubmission>(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}/submit`,
  );
  return data;
};

/**
 * Mark a submitted submission as processed (`submitted` → `processed`). Requires the
 * clearinghouse read feature; records the caller as `processed_by` with `processed_at`.
 */
export const processSubmission = async (uuid: string): Promise<ClearinghouseSubmission> => {
  const { data } = await axios.post<ClearinghouseSubmission>(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}/process`,
  );
  return data;
};

/** Trigger a browser download of a blob under the given filename. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  // Re-type the blob as a neutral, non-renderable binary before creating the
  // object URL. The `download` attribute below already forces a save rather than
  // navigation, so the blob is never loaded as a document in our origin; forcing
  // `application/octet-stream` is defense-in-depth that also clears Snyk's
  // createObjectURL finding. `slice` returns a view, so no bytes are copied, and
  // the saved content and filename/extension (driven by `download`) are unchanged.
  const safeBlob = blob.slice(0, blob.size, 'application/octet-stream');
  const url = URL.createObjectURL(safeBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

/** Download a single file from a submission, saved under its filename. */
export const downloadSubmissionFile = async (uuid: string, filename: string): Promise<void> => {
  const { data } = await axios.get<Blob>(
    `${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}/files/${encodeURIComponent(filename)}`,
    { responseType: 'blob' },
  );
  downloadBlob(data, filename);
};

/**
 * Download every file in a submission as a single zip, saved as `{uuid}.zip`.
 * The backend orders the original report first, then the other files by name.
 */
export const downloadSubmissionArchive = async (uuid: string): Promise<void> => {
  const { data } = await axios.get<Blob>(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/${uuid}/archive`, {
    responseType: 'blob',
  });
  downloadBlob(data, `${uuid}.zip`);
};
