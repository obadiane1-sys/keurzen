/**
 * Tests unitaires — Household composite score
 *
 * Source: packages/shared/src/utils/householdScore.ts — computeHouseholdScore
 *
 * Formula: round(completion*0.35 + balance*0.30 + tlx*0.25 + streak*0.10)
 *   - completion = completedTasks / totalTasks * 100  (100 if 0 tasks)
 *   - balance    = (1 - min(maxImbalance, 0.5) * 2) * 100
 *   - tlx        = 100 - averageTlx
 *   - streak     = min(streakDays, 7) / 7 * 100
 */

import { computeHouseholdScore } from '@keurzen/shared';
import type { HouseholdScoreInput } from '@keurzen/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const perfectInput: HouseholdScoreInput = {
  completedTasks: 10,
  totalTasks: 10,
  maxImbalance: 0,
  averageTlx: 0,
  streakDays: 7,
};

const worstInput: HouseholdScoreInput = {
  completedTasks: 0,
  totalTasks: 10,
  maxImbalance: 0.5,
  averageTlx: 100,
  streakDays: 0,
};

// ─── Dimension: Completion (35%) ─────────────────────────────────────────────

describe('Household Score — Completion dimension', () => {
  it('100% completion → completion value = 100', () => {
    const r = computeHouseholdScore({ ...perfectInput, completedTasks: 10, totalTasks: 10 });
    expect(r.dimensions.completion.value).toBe(100);
  });

  it('0% completion → completion value = 0', () => {
    const r = computeHouseholdScore({ ...perfectInput, completedTasks: 0, totalTasks: 10 });
    expect(r.dimensions.completion.value).toBe(0);
  });

  it('0 total tasks → completion value = 100 (neutral)', () => {
    const r = computeHouseholdScore({ ...perfectInput, completedTasks: 0, totalTasks: 0 });
    expect(r.dimensions.completion.value).toBe(100);
  });

  it('partial completion is proportional', () => {
    const r = computeHouseholdScore({ ...perfectInput, completedTasks: 7, totalTasks: 10 });
    expect(r.dimensions.completion.value).toBe(70);
  });
});

// ─── Dimension: Balance (30%) ────────────────────────────────────────────────

describe('Household Score — Balance dimension', () => {
  it('perfect balance (maxImbalance=0) → balance value = 100', () => {
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0 });
    expect(r.dimensions.balance.value).toBe(100);
  });

  it('max imbalance (0.5) → balance value = 0', () => {
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.5 });
    expect(r.dimensions.balance.value).toBe(0);
  });

  it('imbalance capped at 0.5 — values above 0.5 still give 0', () => {
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.8 });
    expect(r.dimensions.balance.value).toBe(0);
  });

  it('moderate imbalance 0.25 → balance value = 50', () => {
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.25 });
    expect(r.dimensions.balance.value).toBe(50);
  });

  it('small imbalance 0.1 → balance value = 80', () => {
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.1 });
    expect(r.dimensions.balance.value).toBe(80);
  });
});

// ─── Dimension: TLX (25%) ────────────────────────────────────────────────────

describe('Household Score — TLX dimension', () => {
  it('averageTlx=0 → tlx value = 100 (no mental load)', () => {
    const r = computeHouseholdScore({ ...perfectInput, averageTlx: 0 });
    expect(r.dimensions.tlx.value).toBe(100);
  });

  it('averageTlx=100 → tlx value = 0 (max mental load)', () => {
    const r = computeHouseholdScore({ ...perfectInput, averageTlx: 100 });
    expect(r.dimensions.tlx.value).toBe(0);
  });

  it('averageTlx=60 → tlx value = 40', () => {
    const r = computeHouseholdScore({ ...perfectInput, averageTlx: 60 });
    expect(r.dimensions.tlx.value).toBe(40);
  });
});

// ─── Dimension: Streak (10%) ─────────────────────────────────────────────────

describe('Household Score — Streak dimension', () => {
  it('7 days streak → streak value = 100', () => {
    const r = computeHouseholdScore({ ...perfectInput, streakDays: 7 });
    expect(r.dimensions.streak.value).toBe(100);
  });

  it('0 days streak → streak value = 0', () => {
    const r = computeHouseholdScore({ ...perfectInput, streakDays: 0 });
    expect(r.dimensions.streak.value).toBe(0);
  });

  it('streak capped at 7 — 14 days still gives 100', () => {
    const r = computeHouseholdScore({ ...perfectInput, streakDays: 14 });
    expect(r.dimensions.streak.value).toBe(100);
  });

  it('3 days streak → streak value = 43 (3/7*100 rounded)', () => {
    const r = computeHouseholdScore({ ...perfectInput, streakDays: 3 });
    expect(r.dimensions.streak.value).toBe(43);
  });
});

// ─── Composite Score ─────────────────────────────────────────────────────────

describe('Household Score — Composite total', () => {
  it('perfect inputs → total = 100', () => {
    const r = computeHouseholdScore(perfectInput);
    expect(r.total).toBe(100);
  });

  it('worst inputs → total = 0', () => {
    const r = computeHouseholdScore(worstInput);
    expect(r.total).toBe(0);
  });

  it('total is weighted sum of dimensions', () => {
    const input: HouseholdScoreInput = {
      completedTasks: 7,
      totalTasks: 10,
      maxImbalance: 0.1,
      averageTlx: 40,
      streakDays: 5,
    };
    const r = computeHouseholdScore(input);

    // Manual calculation:
    // completion = 70, balance = 80, tlx = 60, streak = round(5/7*100) = 71
    // total = round(70*0.35 + 80*0.30 + 60*0.25 + 71*0.10)
    //       = round(24.5 + 24 + 15 + 7.1) = round(70.6) = 71
    expect(r.dimensions.completion.value).toBe(70);
    expect(r.dimensions.balance.value).toBe(80);
    expect(r.dimensions.tlx.value).toBe(60);
    expect(r.dimensions.streak.value).toBe(71);
    expect(r.total).toBe(71);
  });

  it('total is clamped between 0 and 100', () => {
    // Even with extreme values, total stays in bounds
    const r1 = computeHouseholdScore(perfectInput);
    expect(r1.total).toBeGreaterThanOrEqual(0);
    expect(r1.total).toBeLessThanOrEqual(100);

    const r2 = computeHouseholdScore(worstInput);
    expect(r2.total).toBeGreaterThanOrEqual(0);
    expect(r2.total).toBeLessThanOrEqual(100);
  });

  it('weights sum to 1.0', () => {
    const r = computeHouseholdScore(perfectInput);
    const totalWeight = Object.values(r.dimensions).reduce((sum, d) => sum + d.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0);
  });
});

// ─── Scenario: balance interpretation for household sizes ────────────────────

describe('Household Score — balance scenarios by household size', () => {
  it('2 members, 50/50 split → maxImbalance=0 → balance=100', () => {
    // 50/50: each has share 0.5, expected 0.5, delta=0
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0 });
    expect(r.dimensions.balance.value).toBe(100);
  });

  it('2 members, 100/0 split → maxImbalance=0.5 → balance=0', () => {
    // One does everything: share=1.0, expected=0.5, delta=0.5
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.5 });
    expect(r.dimensions.balance.value).toBe(0);
  });

  it('2 members, 70/30 split → maxImbalance=0.2 → balance=60', () => {
    // 70/30: share=0.7, expected=0.5, delta=0.2
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.2 });
    expect(r.dimensions.balance.value).toBe(60);
  });

  it('3 members, even split → maxImbalance=0 → balance=100', () => {
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0 });
    expect(r.dimensions.balance.value).toBe(100);
  });

  it('3 members, one does everything → maxImbalance≈0.67 → balance=0', () => {
    // share=1.0, expected=0.333, delta=0.667 → capped at 0.5
    const r = computeHouseholdScore({ ...perfectInput, maxImbalance: 0.667 });
    expect(r.dimensions.balance.value).toBe(0);
  });
});
