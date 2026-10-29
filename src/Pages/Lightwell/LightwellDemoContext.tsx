import { createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

const LightwellDemoContext = createContext(false);

export const useLightwellDemo = () => useContext(LightwellDemoContext);

export const LightwellDemoLayout = () => (
  <LightwellDemoContext.Provider value={true}>
    <Alert
      variant='info'
      isInline
      className={`${spacing.mxLg} ${spacing.mtLg}`}
      title='This is a demo site. The data shown here is for demonstration purposes only.'
    />
    <Outlet />
  </LightwellDemoContext.Provider>
);
