import { Bullseye, Content, PageSection, Spinner } from '@patternfly/react-core';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import { usePingQuery } from 'services/Ping/PingQueries';

const Test = () => {
  const { data, isLoading, isError, error } = usePingQuery();

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <>
      <PageHeader>
        <PageHeaderTitle title='Test' />
      </PageHeader>
      <PageSection hasBodyWrapper={false}>
        <Content>{data}</Content>
      </PageSection>
    </>
  );
};

export default Test;
