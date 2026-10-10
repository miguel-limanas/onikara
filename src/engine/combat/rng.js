// PRNG determinístico: o valor sorteado depende só da semente e do cursor.
// O cursor é persistido junto do estado, então retomar um combate continua a mesma sequência.

function hashSeed(seed) {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix(input) {
  let value = (input + 0x6d2b79f5) | 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function createRng(seed, cursor = 0) {
  const base = hashSeed(seed);
  let position = Math.max(0, Math.floor(cursor));

  function next() {
    position += 1;
    return mix((base + Math.imul(position, 0x9e3779b9)) | 0);
  }

  return {
    next,
    chance(probability) {
      const value = next();
      return value < Math.min(Math.max(Number(probability) || 0, 0), 1);
    },
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pickWeighted(items, weightOf = (item) => item.weight ?? 1) {
      const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
      if (!items.length || total <= 0) return null;
      let roll = next() * total;
      for (const item of items) {
        roll -= Math.max(0, weightOf(item));
        if (roll < 0) return item;
      }
      return items[items.length - 1];
    },
    get cursor() {
      return position;
    },
  };
}

export function parseDice(notation, fallback = { count: 1, sides: 4 }) {
  const match = /^\s*(\d{1,2})d(\d{1,3})\s*$/i.exec(String(notation || ''));
  if (!match) return fallback;
  return { count: Math.max(1, Number(match[1])), sides: Math.max(2, Number(match[2])) };
}

export function rollDice(rng, notation) {
  const { count, sides } = parseDice(notation);
  let total = 0;
  for (let index = 0; index < count; index += 1) total += rng.int(1, sides);
  return total;
}
