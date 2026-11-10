import { render, waitFor } from '@testing-library/react';
import { ContextProvider, useAppContext } from './AppContext';
import { useFetchFeaturesQuery } from 'services/Features/FeatureQueries';
import { useKesselWorkspace, useKesselRbac, useTraditionalRbac } from './rbacHelpers';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => jest.fn(() => ({})));

jest.mock('services/Features/FeatureQueries', () => ({
  useFetchFeaturesQuery: jest.fn(),
}));

jest.mock('./rbacHelpers', () => ({
  useKesselWorkspace: jest.fn(),
  useKesselRbac: jest.fn(),
  useTraditionalRbac: jest.fn(),
}));

const Probe = () => {
  const { features, isFetchingPermissions, rbac } = useAppContext();
  return (
    <>
      <div data-testid='app-context-probe-features'>{features ? 'loaded' : 'empty'}</div>
      <div data-testid='app-context-probe-loading'>{String(isFetchingPermissions)}</div>
      <div data-testid='app-context-probe-rbac'>{JSON.stringify(rbac)}</div>
    </>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    (useKesselWorkspace as jest.Mock).mockReturnValue({ workspaceId: 'ws-id', loading: false });
    (useKesselRbac as jest.Mock).mockReturnValue({ rbac: { repoRead: true }, loading: false });
    (useTraditionalRbac as jest.Mock).mockReturnValue({
      rbac: { repoRead: true, repoWrite: true, templateWrite: true, templateRead: true },
      loading: false,
    });
  });

  it('uses traditional rbac when kessel is not enabled', async () => {
    (useFetchFeaturesQuery as jest.Mock).mockReturnValue({
      fetchFeatures: jest.fn().mockResolvedValue({}),
      isLoading: false,
    });

    const { container } = render(
      <ContextProvider>
        <Probe />
      </ContextProvider>,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="app-context-probe-features"]')?.textContent,
      ).toBe('loaded'),
    );
    expect(container.querySelector('[data-testid="app-context-probe-loading"]')).toHaveTextContent(
      'false',
    );
    expect(
      container.querySelector('[data-testid="app-context-probe-rbac"]')?.textContent,
    ).toContain('"repoWrite":true');
  });

  it('uses kessel rbac when kessel feature is enabled', async () => {
    (useFetchFeaturesQuery as jest.Mock).mockReturnValue({
      fetchFeatures: jest.fn().mockResolvedValue({
        kessel: { enabled: true, accessible: true },
      }),
      isLoading: false,
    });
    (useKesselRbac as jest.Mock).mockReturnValue({
      rbac: { repoRead: true, repoWrite: false, templateWrite: false, templateRead: true },
      loading: false,
    });

    const { container } = render(
      <ContextProvider>
        <Probe />
      </ContextProvider>,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="app-context-probe-rbac"]')?.textContent,
      ).toContain('"repoWrite":false'),
    );
    expect(container.querySelector('[data-testid="app-context-probe-loading"]')).toHaveTextContent(
      'false',
    );
  });

  it('does not tell traditional RBAC that features have settled until the fetch resolves', async () => {
    let resolveFetch: (value: object) => void = () => {};
    const fetchPromise = new Promise<object>((resolve) => {
      resolveFetch = resolve;
    });
    (useFetchFeaturesQuery as jest.Mock).mockReturnValue({
      fetchFeatures: jest.fn().mockReturnValue(fetchPromise),
      isLoading: false,
    });

    render(
      <ContextProvider>
        <Probe />
      </ContextProvider>,
    );

    // isLoading reporting `false` before the fetch even starts must not be read as "settled" —
    // otherwise RBAC v1 could fire before we know whether this tenant should use Kessel instead.
    expect(useTraditionalRbac).toHaveBeenCalledWith(expect.anything(), false, true);

    resolveFetch({ kessel: { enabled: true, accessible: true } });

    await waitFor(() =>
      expect(useTraditionalRbac).toHaveBeenLastCalledWith(expect.anything(), true, false),
    );
  });
});
