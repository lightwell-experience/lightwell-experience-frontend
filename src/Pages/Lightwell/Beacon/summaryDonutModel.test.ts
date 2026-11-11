import { NO_REMEDIATION_LABEL, UNREMEDIATED_STATUS } from './constants';
import {
  formatSummarySlice,
  getBeaconSummaryDonutModel,
  getInPipelineCount,
  IN_PIPELINE_LABEL,
} from './summaryDonutModel';

describe('Beacon summary donut model', () => {
  const statusCounts = {
    Submitted: 2,
    'On Hold': 3,
    Classified: 1,
    'Fix in Progress': 4,
    Validation: 1,
    'Lightwell Network': 5,
    [UNREMEDIATED_STATUS]: 7,
  };

  it('counts every status except On Hold and Unremediated as In Pipeline', () => {
    expect(getInPipelineCount(statusCounts)).toBe(2 + 1 + 4 + 1 + 5);
  });

  it('includes statuses outside the stepper in In Pipeline so slices add up to the total', () => {
    const counts = { ...statusCounts, Upstreaming: 2, Published: 3 };
    const { data } = getBeaconSummaryDonutModel(counts);
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    expect(data.reduce((sum, slice) => sum + slice.y, 0)).toBe(total);
    expect(getInPipelineCount(counts)).toBe(13 + 2 + 3);
  });

  it('builds slices in order: On Hold, No remediation, In Pipeline', () => {
    const { data } = getBeaconSummaryDonutModel(statusCounts);

    expect(data).toEqual([
      { x: 'On Hold', y: 3 },
      { x: NO_REMEDIATION_LABEL, y: 7 },
      { x: IN_PIPELINE_LABEL, y: 13 },
    ]);
  });

  it('gives each slice its own color', () => {
    const { data, colorScale } = getBeaconSummaryDonutModel(statusCounts);

    expect(colorScale).toHaveLength(data.length);
    expect(new Set(colorScale).size).toBe(data.length);
  });

  it('defaults missing counts to zero', () => {
    expect(getBeaconSummaryDonutModel(undefined).data.every((slice) => slice.y === 0)).toBe(true);
    expect(getInPipelineCount(undefined)).toBe(0);
  });

  it('formats a slice as "label: count"', () => {
    expect(formatSummarySlice({ datum: { x: NO_REMEDIATION_LABEL, y: 2 } })).toBe(
      `${NO_REMEDIATION_LABEL}: 2`,
    );
  });
});
