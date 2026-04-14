import { renderHook } from '@testing-library/react';
import { useStats } from './useStats';

jest.mock('./useTasks', () => ({ useTasks: jest.fn() }));
jest.mock('./useWeeklyStats', () => ({
  useWeeklyBalance: jest.fn(),
  useCurrentWeekStats: jest.fn(),
}));
jest.mock('./useHouseholdScore', () => ({ useHouseholdScore: jest.fn() }));
jest.mock('./useAnalyticsTrends', () => ({ useAnalyticsTrends: jest.fn() }));
jest.mock('./useTlx', () => ({ useCurrentTlx: jest.fn() }));
jest.mock('@keurzen/stores', () => ({
  useAuthStore: () => ({ user: { id: 'u1' } }),
  useHouseholdStore: () => ({ currentHousehold: { id: 'h1' }, members: [] }),
}));

import { useTasks } from './useTasks';
import { useWeeklyBalance } from './useWeeklyStats';
import { useHouseholdScore } from './useHouseholdScore';
import { useAnalyticsTrends } from './useAnalyticsTrends';
import { useCurrentTlx } from './useTlx';

const mockTasks = useTasks as jest.Mock;
const mockBalance = useWeeklyBalance as jest.Mock;
const mockScore = useHouseholdScore as jest.Mock;
const mockTrends = useAnalyticsTrends as jest.Mock;
const mockTlx = useCurrentTlx as jest.Mock;

// HouseholdScoreResult has `total` (number 0–100) and `dimensions`, NO `level`.
const defaultScore = {
  total: 0,
  dimensions: {
    completion: { label: 'Completion', value: 0, weight: 0.35 },
    balance: { label: 'Equilibre', value: 0, weight: 0.30 },
    tlx: { label: 'Charge mentale', value: 0, weight: 0.25 },
    streak: { label: 'Regularite', value: 0, weight: 0.10 },
  },
};

function setupDefaults() {
  mockTasks.mockReturnValue({ data: [], isLoading: false });
  mockBalance.mockReturnValue({ members: [], isLoading: false });
  mockScore.mockReturnValue({ score: defaultScore, isLoading: false });
  mockTrends.mockReturnValue({ data: [], isLoading: false });
  mockTlx.mockReturnValue({ data: null, isLoading: false });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('useStats — scope=me', () => {
  it('returns empty state when user has no tasks', () => {
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.score).toBeNull();
    expect(result.current.members).toEqual([]);
  });

  it('counts only this users completed tasks', () => {
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null },
        { id: 't2', assigned_to: 'u2', status: 'done', completed_at: new Date().toISOString(), due_date: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    const completed = result.current.kpis.find((k) => k.key === 'completed');
    expect(completed?.value).toBe(1);
  });

  it('exposes completed, streak, overdue, efficiency KPIs', () => {
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    const keys = result.current.kpis.map((k) => k.key);
    expect(keys).toEqual(['completed', 'streak', 'overdue', 'efficiency']);
  });
});

describe('useStats — scope=household', () => {
  it('returns score and coach message when household has tasks', () => {
    mockScore.mockReturnValue({
      score: { ...defaultScore, total: 85 },
      isLoading: false,
    });
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'household', period: 'week' }));
    expect(result.current.score?.total).toBe(85);
    expect(result.current.coachMessage).not.toBeNull();
  });

  it('returns 4 household KPIs with expected keys', () => {
    mockTasks.mockReturnValue({
      data: [
        { id: 't1', assigned_to: 'u1', status: 'done', completed_at: new Date().toISOString(), due_date: null, duration_minutes: 30 },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'household', period: 'week' }));
    const keys = result.current.kpis.map((k) => k.key);
    expect(keys).toEqual(['completed', 'minutes', 'overdue', 'balance']);
  });

  it('surfaces members when useWeeklyBalance returns any', () => {
    mockBalance.mockReturnValue({
      members: [{ userId: 'u1', name: 'Ouss', color: '#967BB6', avatarUrl: null, tasksShare: 1, minutesShare: 0, tasksDelta: 0, minutesDelta: 0, level: 'balanced' }],
      isLoading: false,
    });
    const { result } = renderHook(() => useStats({ scope: 'household', period: 'week' }));
    expect(result.current.members).toHaveLength(1);
  });
});

describe('useStats — loading', () => {
  it('propagates loading from underlying hooks', () => {
    mockTasks.mockReturnValue({ data: [], isLoading: true });
    const { result } = renderHook(() => useStats({ scope: 'me', period: 'week' }));
    expect(result.current.isLoading).toBe(true);
  });
});
