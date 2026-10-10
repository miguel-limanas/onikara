// Modificadores efetivos de atributo. Status e fadiga se somam aqui (ver 05-02).
export function effectiveStat(state, participant, key) {
  return participant.stats[key] ?? 0;
}
