import { loadCombatAvatars, loadMyAvatar } from '../services/avatar.js';
import { avatarMarkup } from '../ui/avatar.js';

// Resolve o avatar de cada participante: jogadores usam o avatar salvo (ou o padrão),
// inimigos usam o avatar padrão pelo elemento.
export async function createAvatarResolver({ sessionId = null, ownProfile = null, ownUserId = null } = {}) {
  const byProfile = await loadCombatAvatars(sessionId);
  if (ownProfile && ownUserId && !byProfile.has(ownProfile.id)) {
    const own = await loadMyAvatar(ownUserId);
    if (own) byProfile.set(ownProfile.id, own);
  }
  return (participant) =>
    participant.team === 'enemy'
      ? avatarMarkup({ kind: 'enemy', name: participant.name, elementId: participant.elementId, size: 'md' })
      : avatarMarkup({
          src: byProfile.get(participant.refId) || null,
          kind: 'player',
          name: participant.name,
          size: 'md',
        });
}
