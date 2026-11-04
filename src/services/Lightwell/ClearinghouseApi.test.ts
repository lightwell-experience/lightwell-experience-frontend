import axios from 'axios';

import {
  createSubmission,
  listSubmissions,
  getSubmission,
  addSubmissionFiles,
  deleteSubmissionFile,
  deleteSubmission,
  submitSubmission,
  processSubmission,
  downloadSubmissionFile,
  downloadSubmissionArchive,
  downloadBlob,
  CLEARINGHOUSE_SUBMISSIONS_PATH,
} from './ClearinghouseApi';

const submission = {
  uuid: 'sub-1',
  status: 'pending' as const,
  created_at: '2026-10-20T10:00:00Z',
  username: 'author@example.com',
  files: [{ uuid: 'f-1', filename: 'submission.json' }],
};

describe('createSubmission', () => {
  it('posts the file contents plus the filename as `name` to the create endpoint', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: submission });

    const file = new File(['{"hello":"world"}'], 'RHOSE-4.9.json', { type: 'application/json' });
    await expect(createSubmission(file)).resolves.toEqual(submission);

    expect(post).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/create`, {
      hello: 'world',
      name: 'RHOSE-4.9.json',
    });

    post.mockRestore();
  });

  it('targets the lightwell clearinghouse submissions path', () => {
    expect(CLEARINGHOUSE_SUBMISSIONS_PATH).toBe('/api/lightwell/v0.1/clearinghouse/submissions');
  });
});

describe('listSubmissions', () => {
  it('gets the submissions list with limit and offset query params', async () => {
    const response = { data: [submission], meta: { count: 1, limit: 20, offset: 0 } };
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: response });

    await expect(listSubmissions(20, 0)).resolves.toEqual(response);
    expect(get).toHaveBeenCalledWith(CLEARINGHOUSE_SUBMISSIONS_PATH, {
      params: { limit: 20, offset: 0 },
    });

    get.mockRestore();
  });
});

describe('getSubmission', () => {
  it('gets a single submission by uuid', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: submission });

    await expect(getSubmission('sub-1')).resolves.toEqual(submission);
    expect(get).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1`);

    get.mockRestore();
  });
});

describe('addSubmissionFiles', () => {
  it('posts each file under a repeated "files" field to the files endpoint', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: submission });

    const f1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const f2 = new File(['b'], 'b.txt', { type: 'text/plain' });
    await expect(addSubmissionFiles('sub-1', [f1, f2])).resolves.toEqual(submission);

    expect(post).toHaveBeenCalledWith(
      `${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1/files`,
      expect.any(FormData),
    );
    const [, formData] = post.mock.calls[0] as [string, FormData];
    expect(formData.getAll('files')).toEqual([f1, f2]);

    post.mockRestore();
  });
});

describe('deleteSubmissionFile', () => {
  it('deletes a single file by url-encoded filename', async () => {
    const del = jest.spyOn(axios, 'delete').mockResolvedValue({ data: undefined });

    await deleteSubmissionFile('sub-1', 'my file.jpg');
    expect(del).toHaveBeenCalledWith(
      `${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1/files/${encodeURIComponent('my file.jpg')}`,
    );

    del.mockRestore();
  });
});

describe('deleteSubmission', () => {
  it('deletes the whole submission by uuid', async () => {
    const del = jest.spyOn(axios, 'delete').mockResolvedValue({ data: undefined });

    await deleteSubmission('sub-1');
    expect(del).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1`);

    del.mockRestore();
  });
});

describe('submitSubmission', () => {
  it('posts to the submit endpoint and returns the submission', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: submission });

    await expect(submitSubmission('sub-1')).resolves.toEqual(submission);
    expect(post).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1/submit`);

    post.mockRestore();
  });
});

describe('processSubmission', () => {
  it('posts to the process endpoint and returns the submission', async () => {
    const processed = { ...submission, status: 'processed' as const };
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: processed });

    await expect(processSubmission('sub-1')).resolves.toEqual(processed);
    expect(post).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1/process`);

    post.mockRestore();
  });
});

describe('downloadBlob', () => {
  it('creates an object url, clicks a temp anchor, and revokes the url', () => {
    const blob = new Blob(['data']);
    const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = jest.fn();
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBlob(blob, 'report.json');

    // The blob is re-typed to a non-renderable binary before the URL is created.
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('application/octet-stream');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    click.mockRestore();
  });
});

describe('downloadSubmissionFile', () => {
  it('fetches the file as a blob and triggers a download under its filename', async () => {
    const blob = new Blob(['data']);
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: blob });
    const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadSubmissionFile('sub-1', 'a.jpg');

    expect(get).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1/files/a.jpg`, {
      responseType: 'blob',
    });
    expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('application/octet-stream');

    get.mockRestore();
    click.mockRestore();
  });
});

describe('downloadSubmissionArchive', () => {
  it('fetches the archive as a blob and triggers a download named {uuid}.zip', async () => {
    const blob = new Blob(['zip']);
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: blob });
    const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const anchor = document.createElement('a');
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue(anchor);

    await downloadSubmissionArchive('sub-1');

    expect(get).toHaveBeenCalledWith(`${CLEARINGHOUSE_SUBMISSIONS_PATH}/sub-1/archive`, {
      responseType: 'blob',
    });
    expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('application/octet-stream');
    expect(anchor.download).toBe('sub-1.zip');

    get.mockRestore();
    click.mockRestore();
    createElement.mockRestore();
  });
});
