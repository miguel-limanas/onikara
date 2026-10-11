import { runSupabase } from './supabaseClient.js';

// Campanha vista pelo jogador: convites recebidos e a campanha ativa do personagem.

export async function loadMyInvitations() {
  const result = await runSupabase((client) => client.rpc('list_my_campaign_invitations'));
  if (!result.ok) return result;
  return {
    ...result,
    data: result.data.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      campaign: { id: row.campaign_id, name: row.campaign_name, description: row.campaign_description },
    })),
  };
}

export async function respondInvitation(invitationId, accept) {
  return runSupabase((client) =>
    client.rpc('respond_campaign_invitation', { p_invitation_id: invitationId, p_accept: accept }),
  );
}

export async function loadMyCampaign(profileId) {
  const membership = await runSupabase((client) =>
    client
      .from('campaign_members')
      .select('joined_at, campaign:campaigns(id, name, description, status, created_at)')
      .eq('profile_id', profileId)
      .maybeSingle(),
  );
  if (!membership.ok) return membership;
  const campaign = membership.data?.campaign;
  return { ok: true, error: null, data: campaign && campaign.status === 'active' ? { ...campaign, joined_at: membership.data.joined_at } : null };
}
