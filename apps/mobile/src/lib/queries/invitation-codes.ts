import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase/client';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdStore } from '../../stores/household.store';
import type { InvitationCode, Household } from '../../types';
import { householdKeys } from './household';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const inviteCodeKeys = {
  recent: (householdId: string) => ['invitation-codes', 'recent', householdId] as const,
};

// ─── Generate & send invite code ─────────────────────────────────────────────

interface GenerateCodeInput {
  email: string;
  firstName?: string;
}

interface GenerateCodeResult {
  success: boolean;
  code: string;
  expires_at: string;
  email_sent: boolean;
  email_error?: string;
}

export function useGenerateInviteCode() {
  const queryClient = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ email, firstName }: GenerateCodeInput): Promise<GenerateCodeResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Non authentifié');
      if (!currentHousehold) throw new Error('Aucun foyer sélectionné');

      // Direct fetch instead of supabase.functions.invoke (hangs on web)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/send-invite-code`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              household_id: currentHousehold.id,
              email,
              first_name: firstName,
            }),
            signal: controller.signal,
          },
        );
        clearTimeout(timeout);

        const payload = (await res.json()) as GenerateCodeResult & { error?: string };
        if (!res.ok || payload.error) {
          throw new Error(payload.error ?? `Erreur ${res.status}`);
        }
        if (!payload.success) {
          throw new Error('Impossible de générer le code');
        }

        return payload;
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error('Délai dépassé — veuillez réessayer');
        }
        throw err;
      }
    },
    onSuccess: () => {
      if (currentHousehold) {
        queryClient.invalidateQueries({
          queryKey: inviteCodeKeys.recent(currentHousehold.id),
        });
      }
    },
  });
}

// ─── Redeem invitation code (for the invitee) ───────────────────────────────

interface RedeemResult {
  household: Household;
  already_member: boolean;
}

export function useRedeemInviteCode() {
  const queryClient = useQueryClient();
  const { setHousehold, setMembers } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (code: string): Promise<RedeemResult> => {
      const { data, error } = await supabase.rpc('redeem_invitation_code', {
        p_code: code.trim(),
      });

      if (error) throw new Error(error.message);

      const result = data as unknown as RedeemResult | { error: string };

      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: async (result) => {
      // Mettre à jour le store avec le nouveau foyer
      setHousehold(result.household);

      // Recharger les membres
      if (user) {
        const { data: members } = await supabase
          .from('household_members')
          .select('*, profile:profiles(*)')
          .eq('household_id', result.household.id);

        if (members) {
          setMembers(members as any);
        }

        queryClient.invalidateQueries({
          queryKey: householdKeys.myHousehold(user.id),
        });
      }
    },
  });
}

// ─── Delete invitation code ─────────────────────────────────────────────

export function useDeleteInviteCode() {
  const queryClient = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('invitation_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (currentHousehold) {
        queryClient.invalidateQueries({
          queryKey: inviteCodeKeys.recent(currentHousehold.id),
        });
      }
    },
  });
}

// ─── Recent codes for current household ──────────────────────────────────────

export function useRecentCodes(householdId: string | undefined) {
  return useQuery({
    queryKey: inviteCodeKeys.recent(householdId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('household_id', householdId!)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as InvitationCode[];
    },
    enabled: !!householdId,
    staleTime: 30_000,
  });
}
