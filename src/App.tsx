import { Bullseye, Spinner } from '@patternfly/react-core';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized';
import { useFlag, useFlagsStatus } from '@unleash/proxy-client-react';

import AppRoutes from './Routes';

const App = () => {
  const lightwellNextAccessEnabled = useFlag('lightwell-experience.lightwell-next-access.enabled');
  const { flagsReady, flagsError } = useFlagsStatus();
  const isLightwellNextPath = () => window.location.pathname.startsWith('/lightwell-next');
  const gateAccess = isLightwellNextPath();

  if (gateAccess && !flagsReady && !flagsError) {
    return (
      <Bullseye>
        <Spinner aria-label='Loading access' />
      </Bullseye>
    );
  }

  if (gateAccess && (flagsError || !lightwellNextAccessEnabled)) {
    return <NotAuthorized serviceName='lightwell-next' />;
  }

  return <AppRoutes />;
};

export default App;
