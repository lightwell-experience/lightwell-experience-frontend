import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => null,
  },
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface Props {
  children: React.ReactNode;
}

export const ReactQueryTestWrapper = ({ children }: Props) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
