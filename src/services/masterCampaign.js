import { runSupabase } from './supabaseClient.js';

// Campanha do mestre. Tudo passa por PostgREST/RPC sob RLS: o mestre só enxerga e
// altera a própria campanha (ver migrations campaigns_and_master e campaign_lifecycle).

export async function loadOwnCampaigns(userId) {
  return runSupabase((client) =>
    client
      .from('campaigns')
      .select('id, name, description, status, created_at, ended_at, medicine_dt')
      .eq('master_user_id', userId)
      .order('created_at', { ascending: false }),
  );
}

export async function loadCampaignById(campaignId) {
  return runSupabase((client) => client.from('campaigns').select('*').eq('id', campaignId).maybeSingle());
}

export async function activateCampaign(campaignId) {
  return runSupabase((client) => client.rpc('activate_campaign', { p_campaign_id: campaignId }));
}

// Quantidade de jogadores por campanha: Map(campaignId -> total).
export async function loadMemberCounts(campaignIds) {
  const result = await runSupabase((client) =>
    client.from('campaign_members').select('campaign_id').in('campaign_id', campaignIds),
  );
  const counts = new Map();
  if (result.ok) result.data.forEach((row) => counts.set(row.campaign_id, (counts.get(row.campaign_id) || 0) + 1));
  return counts;
}

export async function loadOwnCampaign(userId) {
  return runSupabase((client) =>
    client
      .from('campaigns')
      .select('*')
      .eq('master_user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function createCampaign(userId, name, description = '') {
  return runSupabase((client) =>
    client
      .from('campaigns')
      .insert({ master_user_id: userId, name: name.trim(), description: description.trim(), status: 'draft' })
      .select('*')
      .single(),
  );
}

export async function updateCampaign(campaignId, { name, description }) {
  return runSupabase((client) =>
    client
      .from('campaigns')
      .update({ name: name.trim(), description: description.trim() })
      .eq('id', campaignId)
      .select('*')
      .single(),
  );
}

export async function endCampaign(campaignId) {
  return runSupabase((client) => client.rpc('end_campaign', { p_campaign_id: campaignId }));
}

export async function loadArchivedCampaigns(userId) {
  return runSupabase((client) =>
    client
      .from('campaigns')
      .select('id, name, description, created_at, ended_at')
      .eq('master_user_id', userId)
      .eq('status', 'archived')
      .order('ended_at', { ascending: false }),
  );
}

// Sugestões ao digitar: nome do personagem ou e-mail do jogador.
export async function searchCandidates(campaignId, query) {
  return runSupabase((client) =>
    client.rpc('search_campaign_candidates', { p_campaign_id: campaignId, p_query: query }),
  );
}

export async function inviteMember(campaignId, profileId) {
  return runSupabase((client) =>
    client.rpc('invite_campaign_member', { p_campaign_id: campaignId, p_profile_id: profileId }),
  );
}

export async function cancelInvitation(invitationId) {
  return runSupabase((client) => client.rpc('cancel_campaign_invitation', { p_invitation_id: invitationId }));
}

export async function loadPendingInvitations(campaignId) {
  const result = await runSupabase((client) =>
    client.rpc('list_campaign_invitations', { p_campaign_id: campaignId }),
  );
  if (!result.ok) return result;
  return {
    ...result,
    data: result.data.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      profile: { id: row.profile_id, character_name: row.character_name, level: row.level, class_id: row.class_id },
    })),
  };
}

// Histórico de combates encerrados da campanha (mestre e membros).
export async function loadCampaignHistory(campaignId) {
  return runSupabase((client) =>
    client
      .from('combat_sessions')
      .select(
        'id, status, turn_number, started_at, ended_at, participants:combat_participants(id, display_name, team, profile_id, current_stats), rewards:combat_rewards(summary)',
      )
      .eq('campaign_id', campaignId)
      .neq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(50),
  );
}

// Detalhes de um combate encerrado: catálogo do snapshot (nomes de magias/itens) e eventos.
export async function loadCombatSnapshotCatalog(sessionId) {
  const result = await runSupabase((client) =>
    client.from('combat_sessions').select('snapshot').eq('id', sessionId).maybeSingle(),
  );
  if (!result.ok) return { spells: {}, statusEffects: {}, items: {} };
  const catalog = result.data?.snapshot?.engine?.catalog || {};
  return { spells: catalog.spells || {}, statusEffects: catalog.statusEffects || {}, items: catalog.items || {} };
}

export async function loadCampaignDetails(campaignId) {
  const [members, released, granted, enemies, spells, classes, invitations, avatars, emails] = await Promise.all([
    runSupabase((client) =>
      client
        .from('campaign_members')
        .select('profile_id, joined_at, profile:profiles(id, character_name, level, xp, class_id, race_id, current_state)')
        .eq('campaign_id', campaignId)
        .order('joined_at'),
    ),
    runSupabase((client) => client.from('campaign_enemies').select('enemy_id').eq('campaign_id', campaignId)),
    runSupabase((client) => client.from('campaign_member_spells').select('profile_id, spell_id').eq('campaign_id', campaignId)),
    runSupabase((client) => client.from('enemies').select('id, name, level, element_id, description').order('level').order('name')),
    runSupabase((client) => client.from('spells').select('id, name, element_id, rarity, mana_cost, image_url').order('name')),
    runSupabase((client) => client.from('rpg_classes').select('id, name')),
    loadPendingInvitations(campaignId),
    runSupabase((client) => client.rpc('campaign_avatars', { p_campaign_id: campaignId })),
    runSupabase((client) => client.rpc('campaign_player_emails', { p_campaign_id: campaignId })),
  ]);
  for (const result of [members, released, granted, enemies, spells, classes, invitations]) {
    if (!result.ok) return { ok: false, data: null, error: result.error };
  }

  // Estado dos jogadores: itens equipados e efeitos ativos (leitura liberada ao mestre).
  const memberRows = members.data.filter((row) => row.profile);
  const memberIds = memberRows.map((row) => row.profile.id);
  let equipment = [];
  let effects = [];
  if (memberIds.length) {
    const [equipmentResult, effectsResult, statusCatalog] = await Promise.all([
      runSupabase((client) =>
        client.from('equipment').select('profile_id, slot, inventory:inventory(quantity, item:items(*))').in('profile_id', memberIds),
      ),
      runSupabase((client) =>
        client
          .from('character_status_effects')
          .select('profile_id, status_effect_id, stacks, remaining_turns')
          .in('profile_id', memberIds),
      ),
      runSupabase((client) => client.from('status_effects').select('id, name')),
    ]);
    if (equipmentResult.ok) equipment = equipmentResult.data;
    if (effectsResult.ok) {
      const names = new Map((statusCatalog.ok ? statusCatalog.data : []).map((row) => [row.id, row.name]));
      effects = effectsResult.data.map((row) => ({
        profile_id: row.profile_id,
        name: names.get(row.status_effect_id) || row.status_effect_id,
        stacks: row.stacks,
        remainingTurns: row.remaining_turns,
      }));
    }
  }

  return {
    ok: true,
    error: null,
    data: {
      members: memberRows,
      equipment,
      effects,
      releasedEnemyIds: new Set(released.data.map((row) => row.enemy_id)),
      granted: granted.data,
      enemies: enemies.data,
      spells: spells.data,
      classes: classes.data,
      invitations: invitations.data,
      emails: new Map((emails.ok ? emails.data : []).map((row) => [row.profile_id, row.email])),
      avatars: new Map((avatars.ok ? avatars.data : []).map((row) => [row.profile_id, row.avatar])),
    },
  };
}

export async function removeMember(campaignId, profileId) {
  return runSupabase((client) =>
    client.from('campaign_members').delete().eq('campaign_id', campaignId).eq('profile_id', profileId),
  );
}

export async function setEnemyReleased(campaignId, enemyId, released) {
  if (released) {
    return runSupabase((client) =>
      client.from('campaign_enemies').upsert({ campaign_id: campaignId, enemy_id: enemyId }, { onConflict: 'campaign_id,enemy_id' }),
    );
  }
  return runSupabase((client) =>
    client.from('campaign_enemies').delete().eq('campaign_id', campaignId).eq('enemy_id', enemyId),
  );
}

export async function setSpellGranted(campaignId, profileId, spellId, granted) {
  if (granted) {
    return runSupabase((client) =>
      client
        .from('campaign_member_spells')
        .upsert({ campaign_id: campaignId, profile_id: profileId, spell_id: spellId }, { onConflict: 'campaign_id,profile_id,spell_id' }),
    );
  }
  return runSupabase((client) =>
    client
      .from('campaign_member_spells')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('profile_id', profileId)
      .eq('spell_id', spellId),
  );
}

// DT do teste de medicina dos jogadores da campanha (vazio = padrão da regra de recuperação).
export async function setMedicineDt(campaignId, dt) {
  return runSupabase((client) =>
    client.from('campaigns').update({ medicine_dt: dt }).eq('id', campaignId).select('id').single(),
  );
}

export async function loadLastCombatSession(campaignId) {
  return runSupabase((client) =>
    client
      .from('combat_sessions')
      .select('id, status')
      .eq('campaign_id', campaignId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}
