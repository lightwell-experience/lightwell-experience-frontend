import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';

const AppEntry = () => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

export default AppEntry;
