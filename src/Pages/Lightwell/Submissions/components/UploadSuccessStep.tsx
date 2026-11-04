import { useRef, useState } from 'react';
import {
  Alert,
  ButtonVariant,
  Content,
  Flex,
  FlexItem,
  Icon,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { WarningModal } from '@patternfly/react-component-groups';
import { CheckCircleIcon } from '@patternfly/react-icons';

import { LwButton } from 'kit/components/primitives';

import { useSubmissionDetail } from '../hooks/useSubmissionDetail';
import { useSubmissionDrawerParams } from '../hooks/useSubmissionDrawerParams';
import { usePendingReproducers } from './PendingReproducersContext';

export type UploadSuccessStepProps = {
  /** The freshly-created submission; the component fetches it itself. */
  uuid: string;
  /** Fired after the submission is submitted for validation. */
  onSubmitted?: () => void;
  /** Fired after reproducers are uploaded (so the hero can reset while the drawer opens). */
  onReproducersUploaded?: () => void;
};

/**
 * Post-upload confirmation step shown inline in the Submissions hero right after a
 * report is created. It confirms the main report was saved, then offers two
 * mutually-exclusive next moves: upload optional reproducer file(s) — which hands
 * the chosen files to the submission drawer (where the upload actually happens and
 * a skeleton is shown) and opens it — or submit the submission for structural
 * validation. Reproducer management happens in the drawer's SubmissionDetails.
 */
const UploadSuccessStep = ({
  uuid,
  onSubmitted,
  onReproducersUploaded,
}: UploadSuccessStepProps) => {
  const { isLoading, isError, submission, mainFile, submit } = useSubmissionDetail({
    uuid,
    onSubmitted,
  });
  const { openSubmission } = useSubmissionDrawerParams();
  const { setPending } = usePendingReproducers();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  if (isLoading) {
    return <Spinner aria-label='Loading submission' />;
  }

  if (isError || !mainFile) {
    return <Alert variant='danger' isInline isPlain title='Could not load the submission' />;
  }

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!selected.length) return;

    // Hand the chosen files off to the drawer, which performs the upload (showing
    // a skeleton) once it opens, then reset the hero back to the upload form.
    setPending(uuid, selected);
    openSubmission(uuid);
    onReproducersUploaded?.();
  };

  return (
    <Stack hasGutter data-ouia-component-id='upload-success-step'>
      <StackItem>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            <Icon status='success'>
              <CheckCircleIcon />
            </Icon>
          </FlexItem>
          <FlexItem>
            <Content component='p'>
              <code>{submission?.name}</code> was successfully uploaded and saved
            </Content>
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <input
          ref={fileInputRef}
          type='file'
          multiple
          hidden
          data-ouia-component-id='reproducer-file-input'
          onChange={handleFilesSelected}
        />
        <LwButton
          variant='secondary'
          isInline
          onClick={handleUploadClick}
          ouiaId='upload-reproducer'
        >
          Upload optional reproducer file(s)
        </LwButton>
      </StackItem>

      <StackItem>or</StackItem>

      <StackItem>
        <LwButton
          variant='primary'
          onClick={() => setIsSubmitConfirmOpen(true)}
          ouiaId='submit-for-validation'
        >
          Submit for structural validation by your STAM
        </LwButton>
      </StackItem>

      <WarningModal
        isOpen={isSubmitConfirmOpen}
        title='Submit for structural validation?'
        withCheckbox={false}
        confirmButtonLabel='Submit'
        confirmButtonVariant={ButtonVariant.primary}
        onConfirm={() => {
          submit();
          setIsSubmitConfirmOpen(false);
        }}
        onClose={() => setIsSubmitConfirmOpen(false)}
        ouiaId='upload-success-submit-confirm'
      >
        After submitting you can no longer add or remove files for this submission.
      </WarningModal>
    </Stack>
  );
};

export default UploadSuccessStep;
