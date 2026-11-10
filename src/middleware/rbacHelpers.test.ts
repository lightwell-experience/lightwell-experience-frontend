import { renderHook, waitFor } from '@testing-library/react';
import getRBAC from '@redhat-cloud-services/frontend-components-utilities/RBAC';
import {
  useSelfAccessCheck,
  fetchDefaultWorkspace,
} from '@project-kessel/react-kessel-access-check';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { useKesselRbac, useKesselWorkspace, useTraditionalRbac } from './rbacHelpers';

jest.mock('@redhat-cloud-services/frontend-components-utilities/RBAC', () => jest.fn());

jest.mock('@project-kessel/react-kessel-access-check', () => ({
  useSelfAccessCheck: jest.fn(),
  fetchDefaultWorkspace: jest.fn(),
}));

const mockChrome = { auth: { getUser: jest.fn().mockResolvedValue({}) } } as unknown as ChromeAPI;

describe('useTraditionalRbac', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockChrome.auth.getUser as jest.Mock).mockResolvedValue({});
  });

  it('does not fetch RBAC, and stays loading, until features has settled', () => {
    const { result } = renderHook(() => useTraditionalRbac(mockChrome, false, true));

    expect(getRBAC).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(false);
  });

  it('fetches RBAC once features settles, even if the features call failed', async () => {
    (getRBAC as jest.Mock).mockResolvedValue({
      permissions: [{ permission: 'content-sources:repositories:read' }],
    });

    const { result } = renderHook(() => useTraditionalRbac(mockChrome, true, true));

    await waitFor(() => expect(result.current.rbac).toBeDefined());
    expect(getRBAC).toHaveBeenCalled();
    expect(result.current.rbac?.repoRead).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it('surfaces an error and stops loading when the RBAC call itself fails', async () => {
    (getRBAC as jest.Mock).mockRejectedValue(new Error('RBAC is down'));

    const { result } = renderHook(() => useTraditionalRbac(mockChrome, true, true));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.rbac).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });
});

describe('useKesselWorkspace', () => {
  beforeEach(() => jest.clearAllMocks());

  it('surfaces an error when the workspace lookup fails, instead of hanging', async () => {
    (fetchDefaultWorkspace as jest.Mock).mockRejectedValue(new Error('workspace lookup failed'));

    const { result } = renderHook(() => useKesselWorkspace(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.workspaceId).toBeUndefined();
  });
});

describe('useKesselRbac', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports an error instead of hanging when the workspace lookup failed', () => {
    (useSelfAccessCheck as jest.Mock).mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useKesselRbac(undefined, false, true));

    expect(result.current.error).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.rbac).toBeUndefined();
  });

  it('reports an error instead of hanging when the bulk access check fails', () => {
    (useSelfAccessCheck as jest.Mock).mockReturnValue({
      data: undefined,
      loading: false,
      error: { code: 500, message: 'boom', details: [] },
    });

    const { result } = renderHook(() => useKesselRbac('ws-id', false, false));

    expect(result.current.error).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.rbac).toBeUndefined();
  });
});
