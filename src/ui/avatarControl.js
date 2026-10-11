import { BASE_DOLL_OPTIONS, dollLayerUrls } from '../player/paperdoll.js';
import { loadInventory } from '../services/playerInventory.js';
import { loadMyAvatar, saveMyAvatar } from '../services/avatar.js';
import { avatarMarkup, openAvatarEditor } from './avatar.js';

// Botão de avatar redondo para o menu superior (jogador, mestre e admin).
// Com personagem, o recorte parte da imagem atual dele; sem personagem, de um boneco base.
export async function mountAvatarButton(host, { userId, name, profile = null, size = 'md' }) {
  let current = await loadMyAvatar(userId);

  function paint() {
    host.innerHTML = `<button class="ok-avatar-button" type="button" aria-label="Editar avatar de ${name}" title="Editar avatar">${avatarMarkup({ src: current, name, size })}</button>`;
    host.querySelector('button').addEventListener('click', open);
  }

  function sources() {
    if (profile) {
      return [
        {
          id: 'character',
          label: name,
          async loadLayers() {
            const inventory = await loadInventory(profile.id);
            const equipment = Object.fromEntries(
              (inventory.ok ? inventory.data.slots : []).filter((slot) => slot.entry).map((slot) => [slot.id, slot.entry.item]),
            );
            return dollLayerUrls(profile.class_id, equipment);
          },
        },
      ];
    }
    return BASE_DOLL_OPTIONS.map((doll) => ({
      id: doll.id,
      label: doll.label,
      loadLayers: () => dollLayerUrls(doll.id),
    }));
  }

  function open() {
    openAvatarEditor({
      sources: sources(),
      current,
      name,
      async onSave(dataUrl) {
        const result = await saveMyAvatar(dataUrl);
        if (result.ok) {
          current = dataUrl;
          paint();
          window.dispatchEvent(new CustomEvent('onikara:avatar-changed', { detail: { avatar: dataUrl } }));
        }
        return result;
      },
    });
  }

  paint();
  return { getAvatar: () => current };
}
