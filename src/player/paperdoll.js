// Boneco em camadas: empilha PNGs 1024x1536 que compartilham o mesmo quadro.
// A ordem (z) vem do manifest de cada personagem; a troca de base ao empunhar
// itens segue as swap_rules dos manifests.

import { escapeHtml } from '../ui/components.js';

const ART_ROOT = '/art';

// Ponto de troca: quando os itens tiverem campo de arte próprio, substitua
// `SLOT_ART` por uma leitura de `item.art` nas funções abaixo.
const DOLLS = {
  mage: {
    folder: 'paperdoll-v1',
    label: 'Mago Oni',
    bases: { none: 'base.png', main: 'base_staff.png', off: 'base_offhand.png', both: 'base_staff_offhand.png' },
    bodyWithMain: 'body_robe_staff.png',
    slotArt: {
      legs: 'legs_boots.png',
      body: 'body_robe.png',
      head: 'head_mask_b.png',
      main_hand: 'main_hand_staff.png',
      off_hand: 'off_hand_grimoire.png',
      accessory_1: 'accessory_necklace.png',
    },
  },
  warrior: {
    folder: 'paperdoll-guerreira-v1',
    label: 'Guerreira Oni',
    bases: { none: 'base.png', main: 'base_greatsword.png', off: 'base_shield.png', both: 'base_greatsword_shield.png' },
    slotArt: {
      legs: 'legs_boots.png',
      body: 'body_armor.png',
      head: 'head_helmet.png',
      main_hand: 'main_hand_greatsword.png',
      off_hand: 'off_hand_shield.png',
      accessory_1: 'accessory_necklace.png',
    },
  },
};

const BRACERS = [
  { file: 'accessory_bracer_main_arm.png', hiddenWhen: 'main_hand', z: 26 },
  { file: 'accessory_bracer_off_arm.png', hiddenWhen: 'off_hand', z: 26 },
];

const manifestCache = new Map();

// Classe do jogo -> boneco. Classes sem arte própria caem no mago por enquanto.
export function dollKeyForClass(classId) {
  return DOLLS[classId] ? classId : 'mage';
}

async function loadManifest(doll) {
  if (!manifestCache.has(doll.folder)) {
    manifestCache.set(
      doll.folder,
      fetch(`${ART_ROOT}/${doll.folder}/manifest.json`)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
    );
  }
  return manifestCache.get(doll.folder);
}

function zByFile(manifest) {
  const map = new Map();
  (manifest?.layers || []).forEach((layer) => map.set(layer.file, layer.z));
  return map;
}

// Retorna as camadas [{ file, z, slot }] para o equipamento informado.
export function resolveDollLayers(classId, equipment, manifest = null) {
  const doll = DOLLS[dollKeyForClass(classId)];
  const z = zByFile(manifest);
  const main = Boolean(equipment.main_hand);
  const off = Boolean(equipment.off_hand);
  const baseKey = main && off ? 'both' : main ? 'main' : off ? 'off' : 'none';

  const layers = [{ slot: 'base', file: doll.bases[baseKey], z: 0 }];
  Object.entries(doll.slotArt).forEach(([slot, file]) => {
    if (!equipment[slot]) return;
    const chosen = slot === 'body' && main && doll.bodyWithMain ? doll.bodyWithMain : file;
    layers.push({ slot, file: chosen, z: z.get(file) ?? z.get(chosen) ?? 20 });
  });
  if (equipment.accessory_2) {
    BRACERS.filter((bracer) => !equipment[bracer.hiddenWhen]).forEach((bracer) =>
      layers.push({ slot: 'accessory_2', file: bracer.file, z: z.get(bracer.file) ?? bracer.z }),
    );
  }
  return { doll, layers: layers.sort((a, b) => a.z - b.z) };
}

// URLs das camadas (de baixo para cima) do boneco, para compor imagens fora do DOM (ex.: avatar).
export async function dollLayerUrls(classId, equipment = {}) {
  const doll = DOLLS[dollKeyForClass(classId)];
  const manifest = await loadManifest(doll);
  const { layers } = resolveDollLayers(classId, equipment, manifest);
  return layers.map((layer) => `${ART_ROOT}/${doll.folder}/${layer.file}`);
}

// Bonecos base disponíveis para quem não tem personagem (mestre, admin).
export const BASE_DOLL_OPTIONS = Object.entries(DOLLS).map(([id, doll]) => ({ id, label: doll.label }));

// Monta o boneco em `container`. `equipment` mapeia slot -> item (ou truthy).
export async function renderPaperdoll(container, { classId, equipment = {}, name = '' }) {
  const doll = DOLLS[dollKeyForClass(classId)];
  const manifest = await loadManifest(doll);
  const { layers } = resolveDollLayers(classId, equipment, manifest);
  const label = `${doll.label}${name ? `: ${name}` : ''}`;
  container.innerHTML = `
    <div class="ok-paperdoll" role="img" aria-label="${escapeHtml(label)}">
      ${layers
        .map(
          (layer) =>
            `<img class="ok-paperdoll__layer" data-slot="${escapeHtml(layer.slot)}" src="${ART_ROOT}/${doll.folder}/${escapeHtml(layer.file)}" alt="" draggable="false" />`,
        )
        .join('')}
    </div>`;
}
