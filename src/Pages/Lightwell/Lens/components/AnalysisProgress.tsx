import {
  Alert,
  Button,
  Divider,
  Flex,
  FlexItem,
  Icon,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import type { ProcessStep } from '../hooks/useManifestUpload';
import { type ProcessError } from '../utils/errors';

const ANALYSIS_STEPS = [
  { id: 'uploading_manifest', label: 'Uploading manifest' },
  { id: 'preparing_analysis_report', label: 'Preparing analysis report' },
] as const;

type AnalysisStepId = (typeof ANALYSIS_STEPS)[number]['id'];
type AnalysisStepState = 'complete' | 'in_progress' | 'pending' | 'failed';

type AnalysisProgressProps = {
  step: ProcessStep;
  reportUUID: string;
  processError?: ProcessError;
  onRetry: () => void;
};

const getStepStates = (
  step: ProcessStep,
  reportUUID: string,
): Record<AnalysisStepId, AnalysisStepState> => {
  if (step === 'error') {
    // If we have the report UUID, the first (upload) step succeeded
    const failedStepIndex = reportUUID ? 1 : 0;
    return ANALYSIS_STEPS.reduce(
      (states, analysisStep, index) => {
        states[analysisStep.id] = index < failedStepIndex ? 'complete' : 'failed';
        return states;
      },
      {} as Record<AnalysisStepId, AnalysisStepState>,
    );
  }
  if (step === 'analyzing') {
    return { uploading_manifest: 'complete', preparing_analysis_report: 'in_progress' };
  }
  return { uploading_manifest: 'in_progress', preparing_analysis_report: 'pending' };
};

const StepStatus = ({ state }: { state: AnalysisStepState }) => {
  if (state === 'complete') {
    return (
      <Icon status='success' aria-label='Complete'>
        <CheckCircleIcon />
      </Icon>
    );
  }
  if (state === 'failed') {
    return (
      <Icon status='danger' aria-label='Failed'>
        <ExclamationCircleIcon />
      </Icon>
    );
  }
  if (state === 'in_progress') {
    return <Spinner size='sm' aria-label='In progress' />;
  }
  return null;
};

const AnalysisProgress = ({ step, reportUUID, processError, onRetry }: AnalysisProgressProps) => {
  const stepStates = getStepStates(step, reportUUID);

  return (
    <Flex
      direction={{ default: 'column' }}
      gap={{ default: 'gapMd' }}
      alignItems={{ default: 'alignItemsCenter' }}
    >
      <FlexItem>
        <Title headingLevel='h3' size='md'>
          {processError ? 'Analysis failed' : 'Analyzing your manifest...'}
        </Title>
      </FlexItem>
      <FlexItem>
        <Flex
          direction={{ default: 'column' }}
          gap={{ default: 'gapSm' }}
          alignItems={{ default: 'alignItemsStretch' }}
        >
          {ANALYSIS_STEPS.map((analysisStep) => (
            <Flex
              key={analysisStep.id}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              gap={{ default: 'gapMd' }}
              alignItems={{ default: 'alignItemsCenter' }}
            >
              <FlexItem>{analysisStep.label}</FlexItem>
              <FlexItem>
                <StepStatus state={stepStates[analysisStep.id]} />
              </FlexItem>
            </Flex>
          ))}
          {processError ? (
            <>
              <FlexItem className={spacing.ptLg}>
                <Divider component='div' />
              </FlexItem>
              <FlexItem className={spacing.ptMd}>
                <Flex
                  direction={{ default: 'column' }}
                  gap={{ default: 'gapMd' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                >
                  <Alert variant='danger' isInline isPlain title={processError.title}>
                    <span style={{ whiteSpace: 'pre-line' }}>{processError.description}</span>
                  </Alert>
                  <Button variant='primary' onClick={onRetry}>
                    Reupload file
                  </Button>
                </Flex>
              </FlexItem>
            </>
          ) : null}
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default AnalysisProgress;
