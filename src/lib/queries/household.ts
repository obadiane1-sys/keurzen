import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdStore } from '../../stores/household.store';
import type { Household, HouseholdMember, Invitation, InvitationChannel } from '../../types';
import { Colors } from '../../constants/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const INVITATION_EXPIRY_DAYS = 7;

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const householdKeys = {
  myHousehold: (userId: string) => ['household', userId] as const,
  members: (householdId: string) => ['household', 'members', householdId] as const,
  invitations: (householdId: string) => ['household', 'invitations', householdId] as const,
};

// ─── Fetch My Household ───────────────────────────────────────────────────────

export function useMyHousehold() {
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useQuery({
    queryKey: householdKeys.myHousehold(user?.id ?? ''),
    queryFn: async () => {
      // Find the household this user belongs to
      const { data: memberRow, error: memberError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single();

      if (memberError || !memberRow) return null;

      const { data: household, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', memberRow.household_id)
        .single();

      if (error || !household) return null;

      setHousehold(household as Household);

      // Also fetch members
      const { data: members } = await supabase
        .from('household_members')
        .select('*, profile:profiles(*)')
        .eq('household_id', household.id);

      if (members) setMembers(members as HouseholdMember[]);

      return household as Household;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Fetch Members ────────────────────────────────────────────────────────────

export function useHouseholdMembers(householdId?: string) {
  return useQuery({
    queryKey: householdKeys.members(householdId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_members')
        .select('*, profile:profiles(*)')
        .eq('household_id', householdId!);

      if (error) throw new Error(error.message);
      return (data as HouseholdMember[]) ?? [];
    },
    enabled: !!householdId,
  });
}

// ─── Create Household ─────────────────────────────────────────────────────────

export function useCreateHousehold() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async (name: string) => {
      // 1. Create household
      const { data: household, error: hError } = await supabase
        .from('households')
        .insert({ name, created_by: user!.id })
        .select()
        .single();

      if (hError) throw new Error(hError.message);

      // 2. Add current user as owner
      const color = Colors.memberColors[0];
      const { error: mError } = await supabase.from('household_members').insert({
        household_id: household.id,
        user_id: user!.id,
        role: 'owner',
        color,
      });

      if (mError) throw new Error(mError.message);

      setHousehold(household as Household);
      return household as Household;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.myHousehold(user!.id) });
    },
  });
}

// ─── Join Household ───────────────────────────────────────────────────────────

export function useJoinHousehold() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (code: string) => {
      // Find household by invite_code via SECURITY DEFINER RPC
      // (SELECT directe bloquée par RLS : l'utilisateur n'est pas encore membre)
      const { data: rows, error } = await supabase
        .rpc('get_household_by_invite_code', { p_code: code });

      const household = rows?.[0] ?? null;
      if (error || !household) throw new Error('Code invalide ou foyer introuvable');

      // Check not already member
      const { data: existing } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', household.id)
        .eq('user_id', user!.id)
        .single();

      if (existing) throw new Error('Vous êtes déjà membre de ce foyer');

      // Pick a color not used yet
      const { data: currentMembers } = await supabase
        .from('household_members')
        .select('color')
        .eq('household_id', household.id);

      const usedColors = (currentMembers ?? []).map((m) => m.color);
      const color =
        Colors.memberColors.find((c) => !usedColors.includes(c)) ??
        Colors.memberColors[currentMembers!.length % Colors.memberColors.length];

      const { error: joinError } = await supabase.from('household_members').insert({
        household_id: household.id,
        user_id: user!.id,
        role: 'member',
        color,
      });

      if (joinError) throw new Error(joinError.message);

      setHousehold(household as Household);
      return household as Household;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.myHousehold(user!.id) });
    },
  });
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export function usePendingInvitations(householdId?: string) {
  return useQuery({
    queryKey: householdKeys.invitations(householdId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('household_id', householdId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Invitation[]) ?? [];
    },
    enabled: !!householdId,
  });
}

// ─── Send Email Invitation via Edge Function ──────────────────────────────────
// Crée l'invitation en base puis appelle l'Edge Function send-household-invite
// qui envoie l'e-mail via Resend.

export function useSendEmailInvitation() {
  const qc = useQueryClient();
  const { user, session } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      // 1. Créer l'invitation en base
      const { data: invitation, error: invError } = await supabase
        .from('invitations')
        .insert({
          household_id: currentHousehold!.id,
          invited_by: user!.id,
          email,
          channel: 'email' as const,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (invError) throw new Error(invError.message);

      // 2. Déclencher l'envoi via l'Edge Function
      // On force le token explicitement : le FunctionsClient interne peut être
      // désynchronisé si le token a été rafraîchi entre l'INSERT et l'invoke.
      if (!session?.access_token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const { data: result, error: fnError } = await supabase.functions.invoke(
        'send-household-invite',
        {
          body: { invitation_id: invitation.id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      // payload.error contient le message métier de l'Edge Function ;
      // fnError.context contient la réponse brute (non-2xx) — on tente de lire le body.
      const payload = result as { success?: boolean; error?: string } | null;
      if (payload?.error) throw new Error(payload.error);
      if (fnError) {
        const errorBody = await (fnError.context as Response | undefined)?.json?.().catch(() => null) as { error?: string } | null;
        throw new Error(errorBody?.error ?? fnError.message);
      }

      return invitation as Invitation;
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
    }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          household_id: currentHousehold!.id,
          invited_by: user!.id,
          email: email ?? null,
          channel,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Invitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: householdKeys.invitations(currentHousehold!.id),
      });
    },
  });
}

// ─── Join by Token ────────────────────────────────────────────────────────────

export function useJoinByToken() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setHousehold, setMembers } = useHouseholdStore();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('join_household_by_token', {
        p_token: token,
      });

      if (error) throw new Error(error.message);

      const result = data as { error?: string; household?: Partial<Household>; already_member?: boolean } | null;

      if (!result) throw new Error('Réponse vide du serveur');
      if (result.error) throw new Error(result.error);
      if (!result.household) throw new Error('Foyer introuvable');

      const household = result.household as Household;
      setHousehold(household);

      // Fetch fresh members list
      const { data: members } = await supabase
        .from('household_members')
        .select('*, profile:profiles(*)')
        .eq('household_id', household.id);

      if (members) setMembers(members as HouseholdMember[]);

      return { household, alreadyMember: result.already_member ?? false };
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: householdKeys.myHousehold(user.id) });
      }
    },
  });
}

// ─── Invite Preview (sans authentification) ───────────────────────────────────
// Permet d'afficher le nom du foyer et l'inviteur avant que l'utilisateur
// soit connecté (page /join/[token]).

export interface InvitePreview {
  valid: boolean;
  household_name?: string;
  inviter_name?: string;
  invited_email?: string;
  error?: string;
}

export function useInvitePreview(token: string | null) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invite_preview', {
        p_token: token!,
      });
      if (error) throw new Error(error.message);
      return data as InvitePreview;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: householdKeys.invitations(currentHousehold!.id),
      });
    },
  });
}
