// Gerador de aparência em camadas (placeholder visual).
// Primeiro a descrição em texto, derivada de classe e raça; depois um retrato
// em SVG montado por camadas (fundo, corpo, classe, raça) que a arte final
// poderá substituir camada a camada sem mexer no restante da tela.

import { escapeHtml } from '../ui/components.js';

const CLASS_LOOKS = {
  warrior: {
    build: 'ombros largos e postura de quem segura a linha de frente',
    gear: 'empunha uma lâmina pesada e veste placas de ferro escurecido',
    glyph: 'blade',
  },
  mage: {
    build: 'silhueta esguia e olhar fixo, atento ao fluxo da mana',
    gear: 'carrega um cajado coroado de brasa e vestes marcadas por runas',
    glyph: 'staff',
  },
};

const FALLBACK_CLASS_LOOK = {
  build: 'presença firme, ainda por se revelar',
  gear: 'traz o equipamento simples de quem acaba de chegar',
  glyph: 'blade',
};

const ONI_TIERS = [
  { match: /weak|fraco/, tier: 1, trait: 'chifres curtos despontando da testa e olhos cor de brasa' },
  { match: /medium|medio|médio/, tier: 2, trait: 'chifres curvos, pele avermelhada e presas à mostra' },
  { match: /strong|forte/, tier: 3, trait: 'chifres imponentes, pele rubra marcada por cicatrizes e uma aura de calor' },
];

export function describeRace(race) {
  if (!race) return { tier: 0, trait: 'traços ainda indefinidos' };
  const key = `${race.id || ''} ${race.name || ''}`.toLowerCase();
  const tier = ONI_TIERS.find((entry) => entry.match.test(key));
  if (tier) return tier;
  if (race.ancestry === 'oni') {
    return { tier: 1, trait: 'sinais discretos da herança Oni no olhar e na pele' };
  }
  return { tier: 0, trait: 'traços humanos, rosto marcado pela estrada' };
}

export function describeCharacter({ name, rpgClass, race }) {
  const classLook = CLASS_LOOKS[rpgClass?.id] || FALLBACK_CLASS_LOOK;
  const raceLook = describeRace(race);
  const who = name?.trim() || 'Seu personagem';
  const classLabel = rpgClass?.name ? rpgClass.name.toLowerCase() : 'aventureiro';
  const raceLabel = race?.name || 'viajante';
  return `${who} é um ${classLabel} ${raceLabel}: ${classLook.build}. Tem ${raceLook.trait}, e ${classLook.gear}.`;
}

const TIER_SKIN = ['#d8b79a', '#c9604a', '#b83a3a', '#8f1f2b'];

const HORNS = [
  '',
  '<path d="M70 52 L62 38 L76 48Z M110 52 L118 38 L104 48Z" fill="#e8c96a"/>',
  '<path d="M68 54 Q54 36 62 24 Q72 40 78 50Z M112 54 Q126 36 118 24 Q108 40 102 50Z" fill="#e8c96a"/>',
  '<path d="M66 56 Q44 40 52 14 Q70 34 80 50Z M114 56 Q136 40 128 14 Q110 34 100 50Z" fill="#f3ede2"/>',
];

function raceLayer(tier) {
  const skin = TIER_SKIN[tier] || TIER_SKIN[0];
  return `<g data-layer="raca"><circle cx="90" cy="68" r="22" fill="${skin}"/>${HORNS[tier] || ''}<circle cx="82" cy="66" r="2.4" fill="#0d0d0d"/><circle cx="98" cy="66" r="2.4" fill="#0d0d0d"/></g>`;
}

function classLayer(glyph) {
  if (glyph === 'staff') {
    return '<g data-layer="classe"><rect x="132" y="40" width="4" height="120" fill="#b19052"/><circle cx="134" cy="36" r="9" fill="#65a9ff"/><path d="M66 92 L90 88 L114 92 L124 160 L56 160Z" fill="#2a2150" opacity=".9"/></g>';
  }
  return '<g data-layer="classe"><rect x="130" y="50" width="6" height="86" fill="#c8c1b8"/><rect x="122" y="130" width="22" height="5" fill="#b19052"/><path d="M62 92 L118 92 L128 160 L52 160Z" fill="#3a3e47"/><rect x="62" y="92" width="56" height="8" fill="#8b1118"/></g>';
}

export function renderCharacterPortrait({ rpgClass, race, size = 'md' }) {
  const classLook = CLASS_LOOKS[rpgClass?.id] || FALLBACK_CLASS_LOOK;
  const { tier } = describeRace(race);
  const label = `Retrato provisório: ${rpgClass?.name || 'classe'} ${race?.name || ''}`.trim();
  return `
    <svg class="ok-portrait ok-portrait--${size}" viewBox="0 0 180 180" role="img" aria-label="${escapeHtml(label)}">
      <defs>
        <radialGradient id="portrait-glow" cx="50%" cy="40%" r="70%">
          <stop offset="0" stop-color="#8b1118" stop-opacity=".7"/>
          <stop offset="1" stop-color="#0d0d10" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g data-layer="fundo"><rect width="180" height="180" fill="#101012"/><rect width="180" height="180" fill="url(#portrait-glow)"/></g>
      <g data-layer="corpo"><path d="M60 100 L120 100 L128 170 L52 170Z" fill="#282b31"/></g>
      ${classLayer(classLook.glyph)}
      ${raceLayer(tier)}
    </svg>`;
}
