/**
 * Tests unitaires — NASA-TLX score computation
 */

import { computeTlxScore } from '../lib/queries/tlx';

describe('computeTlxScore', () => {
  it('computes mid-range score correctly', () => {
    const score = computeTlxScore({
      mental_demand: 50,
      physical_demand: 50,
      temporal_demand: 50,
      performance: 50, // inverted → 50
      effort: 50,
      frustration: 50,
    });
    expect(score).toBe(50);
  });

  it('inverts performance dimension', () => {
    // All 0 except performance = 100 → inverted = 0
    // score = (0+0+0+0+0+0) / 6 = 0
    const score = computeTlxScore({
      mental_demand: 0,
      physical_demand: 0,
      temporal_demand: 0,
      performance: 100, // inverted → 0
      effort: 0,
      frustration: 0,
    });
    expect(score).toBe(0);
  });

  it('returns max score when everything is max (except performance = 0)', () => {
    const score = computeTlxScore({
      mental_demand: 100,
      physical_demand: 100,
      temporal_demand: 100,
      performance: 0, // inverted → 100
      effort: 100,
      frustration: 100,
    });
    expect(score).toBe(100);
  });

  it('returns score between 0 and 100', () => {
    const cases = [
      { mental_demand: 30, physical_demand: 20, temporal_demand: 80, performance: 60, effort: 50, frustration: 40 },
      { mental_demand: 10, physical_demand: 10, temporal_demand: 10, performance: 90, effort: 10, frustration: 10 },
      { mental_demand: 90, physical_demand: 90, temporal_demand: 90, performance: 10, effort: 90, frustration: 90 },
    ];

    cases.forEach((values) => {
      const score = computeTlxScore(values);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
