import type { ReactNode } from 'react';
import {
  HelperText,
  HelperTextItem,
  MultipleFileUpload,
  MultipleFileUploadMain,
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';

import { LwCard } from 'kit/components/primitives';

export type FileUploadCardProps = {
  /** Card header title, e.g. "Select vulnerability report to upload". */
  title: ReactNode;
  /** Optional header action slot (right side), e.g. a format help popover. */
  action?: ReactNode;
  /** Dropzone prompt. Defaults to "Drag and drop a file here". */
  dropzoneTitle?: string;
  /** Optional format/size guidance rendered inside the dropzone. */
  infoText?: ReactNode;
  /** PF `MultipleFileUpload` horizontal layout. Defaults to true. */
  isHorizontal?: boolean;
  /** The most recently selected file. Shown as selected, or prefixing an error. */
  file?: File;
  /** Inline validation/upload error for the selected file. */
  fileError?: string;
  /** Optional actions rendered below the dropzone (e.g. submit / cancel). */
  footer?: ReactNode;
  onDropAccepted: (files: File[]) => void;
};

/**
 * Reusable single-file upload card: a kit `LwCard` wrapping PF `MultipleFileUpload`.
 * Purely presentational — callers own validation, the drop handler, and footer actions.
 * Shared by Lightwell Lens (manifest upload) and Beacon (clearinghouse intake).
 */
const FileUploadCard = ({
  title,
  action,
  dropzoneTitle = 'Drag and drop a file here',
  infoText,
  isHorizontal = true,
  file,
  fileError,
  footer,
  onDropAccepted,
}: FileUploadCardProps) => (
  <LwCard isGlass={false} hasHeader={title} hasAction={action}>
    <MultipleFileUpload
      isHorizontal={isHorizontal}
      dropzoneProps={{ multiple: false, maxFiles: 1, onDropAccepted }}
    >
      <MultipleFileUploadMain
        titleIcon={<UploadIcon />}
        titleText={dropzoneTitle}
        titleTextSeparator='or'
        browseButtonText='Choose file'
        infoText={infoText}
      />
    </MultipleFileUpload>
    {fileError ? (
      <HelperText>
        <HelperTextItem variant='error'>
          {file?.name ? `${file.name}: ${fileError}` : fileError}
        </HelperTextItem>
      </HelperText>
    ) : file?.name ? (
      <HelperText>
        <HelperTextItem variant='success'>{file.name} selected</HelperTextItem>
      </HelperText>
    ) : null}
    {footer}
  </LwCard>
);

export default FileUploadCard;
