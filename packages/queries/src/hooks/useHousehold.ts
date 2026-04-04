import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import type { Household, HouseholdMember, InvitationChannel } from '@keurzen/shared';
import {
  fetchMyHousehold,
  fetchHouseholdMembers,
  updateMemberProfile,
  createHousehold,
  joinHouseholdByCode,
  joinHouseholdByToken,
  fetchPendingInvitations,
  createInvitation,
  sendEmailInvitation,
  revokeInvitation,
  fetchInvitePreview,
} from '../services/household.service';
import type { InvitePreview } from '../services/household.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const householdKeys = {
  myHousehold: (userId: string) => ['household', userId] as const,
  members: (householdId: string) => ['household', 'members', householdId] as const,
  invitations: (householdId: string) => ['household', 'invitations', householdId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMyHousehold() {
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useQuery({
    queryKey: householdKeys.myHousehold(user?.id ?? ''),
    queryFn: async () => {
      const household = await fetchMyHousehold(user!.id);
      if (!household) return null;

      setHousehold(household);

      const members = await fetchHouseholdMembers(household.id);
      if (members) setMembers(members);

      return household;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHouseholdMembers(householdId?: string) {
  return useQuery({
    queryKey: householdKeys.members(householdId ?? ''),
    queryFn: () => fetchHouseholdMembers(householdId!),
    enabled: !!householdId,
  });
}

export function useUpdateMemberProfile() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { currentHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ fullName, color }: { fullName: string; color: string }) => {
      if (!user) throw new Error('Non authentifie');
      if (!currentHousehold) throw new Error('Aucun foyer');
      await updateMemberProfile(user.id, currentHousehold.id, fullName, color);
    },
    onSuccess: async () => {
      if (!currentHousehold) return;

      const members = await fetchHouseholdMembers(currentHousehold.id);
      if (members) setMembers(members);

      qc.invalidateQueries({ queryKey: householdKeys.members(currentHousehold.id) });
    },
  });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const household = await createHousehold(name, user!.id);
      setHousehold(household);

      const members = await fetchHouseholdMembers(household.id);
      if (members) setMembers(members);

      return household;
    },
    onSuccess: (household) => {
      qc.invalidateQueries({ queryKey: householdKeys.myHousehold(user!.id) });
      qc.invalidateQueries({ queryKey: householdKeys.members(household.id) });
    },
  });
}

export function useJoinHousehold() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async (code: string) => {
      const household = await joinHouseholdByCode(code, user!.id);
      setHousehold(household);

      const members = await fetchHouseholdMembers(household.id);
      if (members) setMembers(members);

      return household;
    },
    onSuccess: (household) => {
      qc.invalidateQueries({ queryKey: householdKeys.myHousehold(user!.id) });
      qc.invalidateQueries({ queryKey: householdKeys.members(household.id) });
    },
  });
}

export function useJoinByToken() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async (token: string) => {
      const { household, alreadyMember } = await joinHouseholdByToken(token);
      setHousehold(household);

      const members = await fetchHouseholdMembers(household.id);
      if (members) setMembers(members);

      return { household, alreadyMember };
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: householdKeys.myHousehold(user.id) });
      }
    },
  });
}

export function usePendingInvitations(householdId?: string) {
  return useQuery({
    queryKey: householdKeys.invitations(householdId ?? ''),
    queryFn: () => fetchPendingInvitations(householdId!),
    enabled: !!householdId,
  });
}

export function useSendEmailInvitation() {
  const qc = useQueryClient();
  const { user, session } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ email, firstName }: { email: string; firstName?: string }) => {
      if (!session?.access_token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      return sendEmailInvitation(
        currentHousehold!.id,
        user!.id,
        session.access_token,
        email,
        firstName
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: householdKeys.invitations(currentHousehold!.id),
      });
    },
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      email,
      channel = 'link',
    }: {
      email?: string;
      channel?: InvitationChannel;
    }) => createInvitation(currentHousehold!.id, user!.id, email, channel),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: householdKeys.invitations(currentHousehold!.id),
      });
    },
  });
}

export function useInvitePreview(token: string | null) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => fetchInvitePreview(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: householdKeys.invitations(currentHousehold!.id),
      });
    },
  });
}

// Re-export the type for consumers
export type { InvitePreview };
