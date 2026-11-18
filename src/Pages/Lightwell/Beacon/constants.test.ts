import { statusReason } from './constants';

describe('statusReason', () => {
  it('joins On Hold reasons in the order they were given', () => {
    expect(
      statusReason({
        status: 'On Hold',
        onHoldReasons: ['Combined build failed', 'Source code unavailable'],
      }),
    ).toBe('Combined build failed, Source code unavailable');
  });

  it('shows a single On Hold reason as it is', () => {
    expect(
      statusReason({ status: 'On Hold', onHoldReasons: ['Waiting on related engineering work'] }),
    ).toBe('Waiting on related engineering work');
  });

  it('has no reason for an On Hold row without reasons', () => {
    expect(statusReason({ status: 'On Hold' })).toBeUndefined();
    expect(statusReason({ status: 'On Hold', onHoldReasons: [] })).toBeUndefined();
  });

  it('keeps showing the closure reason for other statuses', () => {
    expect(
      statusReason({
        status: 'Unremediated',
        resolutionReason: 'The vulnerable component is not present in this package.',
      }),
    ).toBe('The vulnerable component is not present in this package.');
  });

  it('has no reason for other statuses without a closure reason', () => {
    expect(statusReason({ status: 'Submitted' })).toBeUndefined();
  });

  it('ignores a closure reason on an On Hold row', () => {
    expect(
      statusReason({
        status: 'On Hold',
        onHoldReasons: ['Source code unavailable'],
        resolutionReason: 'The vulnerable component is not present in this package.',
      }),
    ).toBe('Source code unavailable');
  });

  it('ignores On Hold reasons on a row that is not On Hold', () => {
    expect(statusReason({ status: 'Validation', onHoldReasons: ['Source code unavailable'] })).toBe(
      undefined,
    );
  });
});
