import { isFeatureOn, type Feature } from './FeatureApi';

describe('isFeatureOn', () => {
  it('returns true when enabled and accessible', () => {
    const feature: Feature = { enabled: true, accessible: true };
    expect(isFeatureOn(feature)).toBe(true);
  });

  it('returns false when enabled but not accessible', () => {
    const feature: Feature = { enabled: true, accessible: false };
    expect(isFeatureOn(feature)).toBe(false);
  });

  it('returns false when accessible but not enabled', () => {
    const feature: Feature = { enabled: false, accessible: true };
    expect(isFeatureOn(feature)).toBe(false);
  });

  it('returns false when the feature is undefined', () => {
    expect(isFeatureOn(undefined)).toBe(false);
  });
});
