import type { Household, HouseholdMember, Invitation, InvitationChannel } from '@keurzen/shared';
import { colors } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Constants ────────────────────────────────────────────────────────────────

const INVITATION_EXPIRY_DAYS = 7;

// ─── Fetch Household By User ──────────────────────────────────────────────────

export async function fetchMyHousehold(userId: string): Promise<Household | null> {
  const supabase = getSupabaseClient();

  const { data: memberRow, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
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
  return household as Household;
}

// ─── Fetch Members ────────────────────────────────────────────────────────────

export async function fetchHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('household_members')
    .select('*, profile:profiles(*)')
    .eq('household_id', householdId);

  if (error) throw new Error(error.message);
  return (data as HouseholdMember[]) ?? [];
}

// ─── Update Member Profile ────────────────────────────────────────────────────

export async function updateMemberProfile(
  userId: string,
  householdId: string,
  fullName: string,
  color: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  const { error: memberError } = await supabase
    .from('household_members')
    .update({ color })
    .eq('household_id', householdId)
    .eq('user_id', userId);

  if (memberError) throw new Error(memberError.message);
}

// ─── Create Household ─────────────────────────────────────────────────────────

export async function createHousehold(
  name: string,
  userId: string
): Promise<Household> {
  const supabase = getSupabaseClient();

  const { data: household, error: hError } = await supabase
    .from('households')
    .insert({ name, created_by: userId })
    .select()
    .single();

  if (hError) throw new Error(hError.message);

  const color = colors.memberColors[0];
  const { error: mError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'owner',
    color,
  });

  if (mError) throw new Error(mError.message);

  return household as Household;
}

// ─── Join Household By Code ───────────────────────────────────────────────────

export async function joinHouseholdByCode(
  code: string,
  userId: string
): Promise<Household> {
  const supabase = getSupabaseClient();

  const { data: rows, error } = await supabase.rpc('get_household_by_invite_code', {
    p_code: code,
  });

  const household = rows?.[0] ?? null;
  if (error || !household) throw new Error('Code invalide ou foyer introuvable');

  // Check not already member
  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household.id)
    .eq('user_id', userId)
    .single();

  if (existing) throw new Error('Vous êtes déjà membre de ce foyer');

  // Pick a color not used yet
  const { data: currentMembers } = await supabase
    .from('household_members')
    .select('color')
    .eq('household_id', household.id);

  const usedColors = (currentMembers ?? []).map((m) => m.color);
  const color =
    colors.memberColors.find((c) => !usedColors.includes(c)) ??
    colors.memberColors[currentMembers!.length % colors.memberColors.length];

  const { error: joinError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'member',
    color,
  });

  if (joinError) throw new Error(joinError.message);

  return household as Household;
}

// ─── Join Household By Token ──────────────────────────────────────────────────

export async function joinHouseholdByToken(
  token: string
): Promise<{ household: Household; alreadyMember: boolean }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('join_household_by_token', {
    p_token: token,
  });

  if (error) throw new Error(error.message);

  const result = data as {
    error?: string;
    household?: Partial<Household>;
    already_member?: boolean;
  } | null;

  if (!result) throw new Error('Réponse vide du serveur');
  if (result.error) throw new Error(result.error);
  if (!result.household) throw new Error('Foyer introuvable');

  return {
    household: result.household as Household,
    alreadyMember: result.already_member ?? false,
  };
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export async function fetchPendingInvitations(householdId: string): Promise<Invitation[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('household_id', householdId)
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Invitation[]) ?? [];
}

export async function createInvitation(
  householdId: string,
  userId: string,
  email?: string,
  channel: InvitationChannel = 'link'
): Promise<Invitation> {
  const supabase = getSupabaseClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      household_id: householdId,
      invited_by: userId,
      email: email ?? null,
      channel,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Invitation;
}

export async function sendEmailInvitation(
  householdId: string,
  userId: string,
  accessToken: string,
  email: string,
  firstName?: string
): Promise<Invitation> {
  const supabase = getSupabaseClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  // 1. Create invitation in DB
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .insert({
      household_id: householdId,
      invited_by: userId,
      email,
      first_name: firstName ?? null,
      channel: 'email' as const,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (invError) throw new Error(invError.message);

  // 2. Trigger email via Edge Function
  const { data: result, error: fnError } = await supabase.functions.invoke(
    'send-household-invite',
    {
      body: { invitation_id: invitation.id },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const payload = result as { success?: boolean; error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
  if (fnError) {
    const errorBody = (await (fnError.context as Response | undefined)
      ?.json?.()
      .catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? fnError.message);
  }

  return invitation as Invitation;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.functions.invoke('revoke-invitation', {
    body: { invitation_id: invitationId },
  });

  if (error) throw new Error(error.message);
}

// ─── Invite Preview ───────────────────────────────────────────────────────────

export interface InvitePreview {
  valid: boolean;
  household_name?: string;
  inviter_name?: string;
  invited_email?: string;
  error?: string;
}

export async function fetchInvitePreview(token: string): Promise<InvitePreview> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_invite_preview', {
    p_token: token,
  });

  if (error) throw new Error(error.message);
  return data as InvitePreview;
}
