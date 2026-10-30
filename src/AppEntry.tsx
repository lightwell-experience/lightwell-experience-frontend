import { AlertVariant } from '@patternfly/react-core';
import {
  createStore as createNotificationStore,
  NotificationsProvider,
} from '@redhat-cloud-services/frontend-components-notifications';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import * as Redux from 'redux';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';

import { composeErrorDescription } from 'Hooks/useErrorNotification';
import App from './App';
import { ContextProvider } from './middleware/AppContext';
import { createStore, restoreStore } from './store';

interface AppEntryProps {
  logger?: Redux.Middleware;
}

const notificationsStore = createNotificationStore();

export default function AppEntry({ logger }: AppEntryProps) {
  const store = React.useMemo(() => {
    restoreStore();
    if (logger) {
      return createStore(logger).store;
    }
    return createStore().store;
  }, [logger]);

  useEffect(() => {
    insights?.chrome?.appAction?.('view-list-page');
  }, []);

  const kesselBaseUrl = window.location.origin;

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
        queryCache: new QueryCache({
          onError: (_, query) => {
            if (query.meta?.title) {
              const { title, description } = composeErrorDescription(
                query.meta.title as string,
                'An error occurred',
                query.state.error,
              );
              notificationsStore.addNotification({
                title,
                description,
                variant: AlertVariant.danger,
              });
            }
          },
        }),
      }),
  );

  return (
    <ReduxProvider store={store}>
      <NotificationsProvider store={notificationsStore}>
        <QueryClientProvider client={queryClient}>
          <AccessCheck.Provider baseUrl={kesselBaseUrl} apiPath='/api/kessel/v1beta2'>
            <ContextProvider>
              <App />
            </ContextProvider>
          </AccessCheck.Provider>
        </QueryClientProvider>
      </NotificationsProvider>
    </ReduxProvider>
  );
}
