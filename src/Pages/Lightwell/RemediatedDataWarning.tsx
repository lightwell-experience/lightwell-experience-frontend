import { Alert } from '@patternfly/react-core';

type RemediatedDataWarningProps = {
  className?: string;
};

const RemediatedDataWarning = ({ className }: RemediatedDataWarningProps) => (
  <Alert
    variant='warning'
    isInline
    title='This data is sensitive. Do not share or capture screenshots.'
    className={className}
  />
);

export default RemediatedDataWarning;
