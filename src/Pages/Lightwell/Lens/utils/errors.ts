export type ProcessError = { title: string; description: string };

const API_ERROR_DEFAULTS = {
  upload: ['Could not upload manifest', 'Something went wrong while uploading your manifest'],
  fetch: ['Could not fetch analysis report', 'Something went wrong while fetching your report'],
} as const;

export function apiError(context: 'upload' | 'fetch'): ProcessError {
  const [title, description] = API_ERROR_DEFAULTS[context];
  return { title, description };
}

export function taskError(error?: string): ProcessError {
  return {
    title: 'Could not prepare analysis report',
    description: error
      ? error[0].toUpperCase() + error.slice(1)
      : 'Something went wrong while preparing your report',
  };
}

export function timeoutError(): ProcessError {
  return {
    title: 'Could not prepare analysis report',
    description: 'Analysis took longer than expected',
  };
}
