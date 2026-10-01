import { ErrorBoundary } from '@patternfly/react-component-groups';

interface Props {
  children: React.ReactNode;
}

export const ErrorPage = ({ children }: Props) => (
  <ErrorBoundary
    headerTitle=''
    errorTitle='Unhandled error'
    errorDescription='There was a problem trying to process your request'
  >
    {children}
  </ErrorBoundary>
);
