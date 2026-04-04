import { create } from 'zustand';
import type { Household, HouseholdMember } from '@keurzen/shared';

interface HouseholdState {
  currentHousehold: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;

  setHousehold: (household: Household | null) => void;
  setMembers: (members: HouseholdMember[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  currentHousehold: null,
  members: [],
  isLoading: false,

  setHousehold: (currentHousehold) => set({ currentHousehold }),
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ currentHousehold: null, members: [], isLoading: false }),
}));
