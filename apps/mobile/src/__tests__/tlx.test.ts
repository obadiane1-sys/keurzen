/**
 * Tests unitaires — NASA-TLX score computation
 *
 * Source: packages/shared/src/utils/index.ts — computeTlxScore
 * Formula: round( (mental + physical + temporal + (100-performance) + effort + frustration) / 6 )
 */

import { computeTlxScore } from '@keurzen/shared';

const allZeros = {
  mental_demand: 0,
  physical_demand: 0,
  temporal_demand: 0,
  performance: 0,
  effort: 0,
  frustration: 0,
};

describe('computeTlxScore (shared)', () => {
  it('returns 0 when all dimensions are 0 and performance is 100', () => {
    const score = computeTlxScore({
      ...allZeros,
      performance: 100, // inverted -> 0
    });
    expect(score).toBe(0);
  });

  it('returns 100 when all dimensions are 100 and performance is 0', () => {
    const score = computeTlxScore({
      mental_demand: 100,
      physical_demand: 100,
      temporal_demand: 100,
      performance: 0, // inverted -> 100
      effort: 100,
      frustration: 100,
    });
    expect(score).toBe(100);
  });

  it('computes mid-range score correctly (all 50s)', () => {
    const score = computeTlxScore({
      mental_demand: 50,
      physical_demand: 50,
      temporal_demand: 50,
      performance: 50, // inverted -> 50
      effort: 50,
      frustration: 50,
    });
    expect(score).toBe(50);
  });

  it('inverts performance — high performance reduces score', () => {
    const highPerf = computeTlxScore({ ...allZeros, performance: 80 });
    const lowPerf = computeTlxScore({ ...allZeros, performance: 20 });
    // high performance = low workload -> lower score
    expect(highPerf).toBeLessThan(lowPerf);
  });

  it('computes asymmetric values correctly', () => {
    // (30 + 20 + 80 + (100-60) + 50 + 40) / 6 = (30+20+80+40+50+40)/6 = 260/6 = 43.33 -> 43
    const score = computeTlxScore({
      mental_demand: 30,
      physical_demand: 20,
      temporal_demand: 80,
      performance: 60,
      effort: 50,
      frustration: 40,
    });
    expect(score).toBe(43);
  });

  it('handles single high dimension', () => {
    // Only mental_demand = 90, rest 0 (perf 0 -> inverted 100... no, perf=100 -> inverted 0)
    const score = computeTlxScore({
      ...allZeros,
      performance: 100, // inverted -> 0
      mental_demand: 90,
    });
    // (90 + 0 + 0 + 0 + 0 + 0) / 6 = 15
    expect(score).toBe(15);
  });

  it('rounds to nearest integer', () => {
    // (10 + 10 + 10 + (100-90) + 10 + 10) / 6 = (10+10+10+10+10+10)/6 = 60/6 = 10
    const exact = computeTlxScore({
      mental_demand: 10,
      physical_demand: 10,
      temporal_demand: 10,
      performance: 90,
      effort: 10,
      frustration: 10,
    });
    expect(exact).toBe(10);

    // (11 + 10 + 10 + (100-90) + 10 + 10) / 6 = 61/6 = 10.166... -> 10
    const roundDown = computeTlxScore({
      mental_demand: 11,
      physical_demand: 10,
      temporal_demand: 10,
      performance: 90,
      effort: 10,
      frustration: 10,
    });
    expect(roundDown).toBe(10);

    // (13 + 10 + 10 + (100-90) + 10 + 10) / 6 = 63/6 = 10.5 -> 11
    const roundUp = computeTlxScore({
      mental_demand: 13,
      physical_demand: 10,
      temporal_demand: 10,
      performance: 90,
      effort: 10,
      frustration: 10,
    });
    expect(roundUp).toBe(11);
  });

  it('always returns a value between 0 and 100', () => {
    const cases = [
      { mental_demand: 0, physical_demand: 0, temporal_demand: 0, performance: 100, effort: 0, frustration: 0 },
      { mental_demand: 100, physical_demand: 100, temporal_demand: 100, performance: 0, effort: 100, frustration: 100 },
      { mental_demand: 30, physical_demand: 20, temporal_demand: 80, performance: 60, effort: 50, frustration: 40 },
      { mental_demand: 90, physical_demand: 90, temporal_demand: 90, performance: 10, effort: 90, frustration: 90 },
    ];
    cases.forEach((values) => {
      const score = computeTlxScore(values);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

