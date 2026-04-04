/**
 * Tests unitaires — calcul du déséquilibre hebdomadaire
 */

import { computeImbalanceLevel } from '../lib/queries/weekly-stats';

describe('computeImbalanceLevel', () => {
  it('returns balanced when not enough data', () => {
    expect(computeImbalanceLevel(0.3, 3, 30)).toBe('balanced');
    expect(computeImbalanceLevel(0.3, 10, 30)).toBe('balanced');
    expect(computeImbalanceLevel(0.3, 3, 90)).toBe('balanced');
  });

  it('returns balanced when delta is small', () => {
    expect(computeImbalanceLevel(0.1, 10, 120)).toBe('balanced');
    expect(computeImbalanceLevel(-0.1, 10, 120)).toBe('balanced');
  });

  it('returns watch when delta is moderate', () => {
    expect(computeImbalanceLevel(0.20, 10, 120)).toBe('watch');
    expect(computeImbalanceLevel(-0.22, 10, 120)).toBe('watch');
  });

  it('returns unbalanced when delta is high', () => {
    expect(computeImbalanceLevel(0.32, 10, 120)).toBe('unbalanced');
    expect(computeImbalanceLevel(-0.35, 10, 120)).toBe('unbalanced');
  });
});
