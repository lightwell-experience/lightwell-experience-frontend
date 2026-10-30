import { isBreakpointAtLeast } from '../components/components.config';

describe('isBreakpointAtLeast', () => {
  it('xs is below everything', () => {
    expect(isBreakpointAtLeast('xs', 'sm')).toBe(false);
    expect(isBreakpointAtLeast('xs', 'md')).toBe(false);
    expect(isBreakpointAtLeast('xs', 'lg')).toBe(false);
  });

  it('sm is at least sm but below md', () => {
    expect(isBreakpointAtLeast('sm', 'sm')).toBe(true);
    expect(isBreakpointAtLeast('sm', 'md')).toBe(false);
  });

  it('lg is at least md and lg but below xl', () => {
    expect(isBreakpointAtLeast('lg', 'md')).toBe(true);
    expect(isBreakpointAtLeast('lg', 'lg')).toBe(true);
    expect(isBreakpointAtLeast('lg', 'xl')).toBe(false);
  });

  it('2xl is at least everything', () => {
    expect(isBreakpointAtLeast('2xl', 'sm')).toBe(true);
    expect(isBreakpointAtLeast('2xl', '2xl')).toBe(true);
  });
});

describe('useLwBreakpoint', () => {
  it('falls back to lg in JSDOM (no matchMedia)', async () => {
    const { useLwBreakpoint } = await import('./useLwBreakpoint');
    const { renderHook } = await import('@testing-library/react');

    const { result } = renderHook(() => useLwBreakpoint());
    expect(result.current).toBe('lg');
  });
});
