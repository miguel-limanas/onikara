import { runSupabase } from './supabaseClient.js';

export const MAX_SPELL_SLOTS = 8;

// Estados: locked (nível insuficiente), unlocked, equipped.
export async function loadSpellbook(profile) {
  const [classSpells, owned] = await Promise.all([
    runSupabase((client) =>
      client
        .from('class_spells')
        .select('unlock_level, spell:spells(*, element:elements(id,name))')
        .eq('class_id', profile.class_id)
        .order('unlock_level'),
    ),
    runSupabase((client) => client.from('character_spells').select('*').eq('profile_id', profile.id)),
  ]);
  if (!classSpells.ok) return { ok: false, data: null, error: classSpells.error };
  if (!owned.ok) return { ok: false, data: null, error: owned.error };

  const equippedBySpell = new Map(owned.data.filter((row) => row.equipped).map((row) => [row.spell_id, row.slot]));
  const spells = classSpells.data
    .filter((row) => row.spell)
    .map((row) => {
      const unlocked = profile.level >= row.unlock_level;
      const slot = equippedBySpell.get(row.spell.id) ?? null;
      const equipped = unlocked && equippedBySpell.has(row.spell.id);
      return {
        spell: row.spell,
        unlockLevel: row.unlock_level,
        slot,
        state: !unlocked ? 'locked' : equipped ? 'equipped' : 'unlocked',
      };
    });

  const usedSlots = new Set(spells.filter((entry) => entry.state === 'equipped').map((entry) => entry.slot));
  return { ok: true, data: { spells, usedSlots }, error: null };
}

export async function setSpellEquipped(profile, spellId, equipped, usedSlots) {
  let slot = null;
  if (equipped) {
    for (let candidate = 1; candidate <= MAX_SPELL_SLOTS; candidate += 1) {
      if (!usedSlots.has(candidate)) {
        slot = candidate;
        break;
      }
    }
    if (slot === null) {
      return {
        ok: false,
        error: { code: 'no_slot', message: `Você já equipou ${MAX_SPELL_SLOTS} magias. Desequipe uma antes.` },
      };
    }
  }
  return runSupabase((client) =>
    client
      .from('character_spells')
      .upsert({ profile_id: profile.id, spell_id: spellId, equipped, slot }, { onConflict: 'profile_id,spell_id' })
      .select('*')
      .single(),
  );
}
