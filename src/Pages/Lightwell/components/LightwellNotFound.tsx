import { PageSection } from '@patternfly/react-core';
import { MissingPage } from '@patternfly/react-component-groups';

import { LIGHTWELL_ROUTE } from 'Pages/Lightwell/constants';

const LightwellNotFound = () => (
  <PageSection hasBodyWrapper={false}>
    <MissingPage
      titleText="We couldn't find that page"
      bodyText='The page may not exist or you may not have access to it yet.'
      toHomePageUrl={LIGHTWELL_ROUTE}
      toHomePageText='Return to homepage'
    />
  </PageSection>
);

export default LightwellNotFound;
