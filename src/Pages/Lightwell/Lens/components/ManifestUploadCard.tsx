import {
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem,
  MultipleFileUpload,
  MultipleFileUploadMain,
  Title,
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import ManifestFormatPopover from './ManifestFormatPopover';

import type { ProcessStep } from '../hooks/useManifestUpload';
import type { ProcessError } from '../utils/errors';
import AnalysisProgress from './AnalysisProgress';

export type ManifestUploadCardProps = {
  step: ProcessStep;
  reportUUID: string;
  file?: File;
  fileError?: string;
  processError?: ProcessError;
  onDropAccepted: (files: File[]) => void;
  onRetry: () => void;
};

const ManifestUploadCard = ({
  step,
  reportUUID,
  file,
  fileError,
  processError,
  onDropAccepted,
  onRetry,
}: ManifestUploadCardProps) => {
  const showProgress = step === 'uploading' || step === 'analyzing' || !!processError;

  return (
    <Card isGlass>
      {showProgress ? (
        <CardBody className={spacing.p_2xl}>
          <AnalysisProgress
            step={step}
            reportUUID={reportUUID}
            processError={processError}
            onRetry={onRetry}
          />
        </CardBody>
      ) : (
        <CardBody className={spacing.pXl}>
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
            <FlexItem>
              <Flex gap={{ default: 'gapNone' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Title headingLevel='h3' size='md'>
                    Upload SBOM or package manifest
                  </Title>
                </FlexItem>
                <FlexItem>
                  <ManifestFormatPopover />
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <MultipleFileUpload dropzoneProps={{ multiple: false, maxFiles: 1, onDropAccepted }}>
                <MultipleFileUploadMain
                  titleIcon={<UploadIcon />}
                  titleText='Drag and drop a file here'
                  titleTextSeparator='or'
                  browseButtonText='Select file'
                  infoText={
                    <Content>
                      Supported formats: CSV, CycloneDX, SPDX, POM, requirements.txt
                      <br />
                      File size limit: Up to 10MB for POM files. Up to 15MB for all other supported
                      formats.
                    </Content>
                  }
                />
              </MultipleFileUpload>
              {fileError ? (
                <HelperText>
                  <HelperTextItem variant='error'>
                    {file?.name ? `${file.name}: ${fileError}` : fileError}
                  </HelperTextItem>
                </HelperText>
              ) : null}
            </FlexItem>
          </Flex>
        </CardBody>
      )}
    </Card>
  );
};

export default ManifestUploadCard;
