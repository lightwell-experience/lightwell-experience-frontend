import { useState } from 'react';
import { AlertVariant } from '@patternfly/react-core';

import useNotification from 'Hooks/useNotification';
import { composeErrorDescription } from 'Hooks/useErrorNotification';
import { useCreateSubmissionMutation } from 'services/Lightwell/ClearinghouseQueries';
import { validateSubmissionFile } from '../utils/validateSubmissionFile';
import { useCurrentUsername } from './useCurrentUsername';

export type SubmissionsStep = 'select' | 'uploading' | 'detail';

/**
 * Drives the clearinghouse intake flow. Selecting a valid JSON file validates it
 * and immediately creates the submission (Lens-style auto-upload); on success the
 * view moves to `detail` with the new submission's uuid. On failure it returns to
 * `select` with the selection cleared; the error toast explains why.
 */
export const useSubmissions = () => {
  const { notify } = useNotification();
  const currentUsername = useCurrentUsername();
  const createSubmission = useCreateSubmissionMutation();
  const [step, setStep] = useState<SubmissionsStep>('select');
  const [file, setFile] = useState<File | undefined>();
  const [fileError, setFileError] = useState<string | undefined>();
  const [createdUuid, setCreatedUuid] = useState<string | undefined>();

  // Uses dropzoneProps.onDropAccepted instead of onFileInputChange to avoid a PF bug
  // where onFileInputChange fires twice when selecting a file via the browser dialog.
  const handleFileAccepted = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    const error = validateSubmissionFile(selectedFile);
    setFile(selectedFile);
    setFileError(error);
    if (error) return;

    setStep('uploading');
    createSubmission.mutate(selectedFile, {
      onSuccess: (submission) => {
        setCreatedUuid(submission.uuid);
        setStep('detail');
        // Don't say "by me": only credit an author when it isn't the current user.
        const showAuthor = !!submission.username && submission.username !== currentUsername;
        notify({
          variant: AlertVariant.success,
          title: 'Submission created',
          description: showAuthor ? `Submission created by ${submission.username}.` : undefined,
        });
      },
      onError: (err) => {
        setStep('select');
        // The backend rejected the file, so it is no longer "selected": clear it to
        // avoid showing a success check next to the error toast.
        setFile(undefined);
        // Surface the backend's reason (e.g. too many files, duplicate filename)
        // instead of a generic message; fall back to the generic text otherwise.
        const { title, description } = composeErrorDescription(
          'Submission failed',
          'Could not create the submission. Please try again.',
          err,
        );
        notify({ variant: AlertVariant.danger, title, description });
      },
    });
  };

  const reset = () => {
    setStep('select');
    setFile(undefined);
    setFileError(undefined);
    setCreatedUuid(undefined);
  };

  return {
    step,
    file,
    fileError,
    createdUuid,
    isUploading: createSubmission.isPending,
    onDropAccepted: handleFileAccepted,
    reset,
  };
};
