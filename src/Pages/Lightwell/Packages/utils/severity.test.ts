import { normalizeAdvisorySeverity } from './severity';

describe('normalizeAdvisorySeverity', () => {
  it.each([
    [9.800000190734863, 'Critical'],
    [9.0, 'Critical'],
    [7.5, 'Important'],
    [7.0, 'Important'],
    [5.300000190734863, 'Moderate'],
    [4.0, 'Moderate'],
    [3.9000000953674316, 'Low'],
  ])('maps a CVSS score of %s to %s', (score, expected) => {
    expect(normalizeAdvisorySeverity(score)).toBe(expected);
  });

  it('maps a zero score to None', () => {
    expect(normalizeAdvisorySeverity(0)).toBe('None');
  });
});
