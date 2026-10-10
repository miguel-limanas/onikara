import { runSupabase } from './supabaseClient.js';

// Campanha do mestre. Tudo passa por PostgREST/RPC sob RLS: o mestre só enxerga e
// altera a própria campanha (ver migration campaigns_and_master).

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

export async function createCampaign(userId, name) {
  return runSupabase((client) =>
    client.from('campaigns').insert({ master_user_id: userId, name: name.trim() }).select('*').single(),
  );
}

export async function loadCampaignDetails(campaignId) {
  const [members, released, granted, enemies, spells, classes] = await Promise.all([
    runSupabase((client) =>
      client
        .from('campaign_members')
        .select('profile_id, joined_at, profile:profiles(id, character_name, level, class_id, race_id)')
        .eq('campaign_id', campaignId)
        .order('joined_at'),
    ),
    runSupabase((client) => client.from('campaign_enemies').select('enemy_id').eq('campaign_id', campaignId)),
    runSupabase((client) => client.from('campaign_member_spells').select('profile_id, spell_id').eq('campaign_id', campaignId)),
    runSupabase((client) => client.from('enemies').select('id, name, level, element_id, description').order('level').order('name')),
    runSupabase((client) => client.from('spells').select('id, name, element_id, rarity, mana_cost').order('name')),
    runSupabase((client) => client.from('rpg_classes').select('id, name')),
  ]);
  for (const result of [members, released, granted, enemies, spells, classes]) {
    if (!result.ok) return { ok: false, data: null, error: result.error };
  }
  return {
    ok: true,
    error: null,
    data: {
      members: members.data.filter((row) => row.profile),
      releasedEnemyIds: new Set(released.data.map((row) => row.enemy_id)),
      granted: granted.data,
      enemies: enemies.data,
      spells: spells.data,
      classes: classes.data,
    },
  };
}

export async function addMember(campaignId, characterName) {
  return runSupabase((client) =>
    client.rpc('add_campaign_member', { p_campaign_id: campaignId, p_character_name: characterName }),
  );
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
