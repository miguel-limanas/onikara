export class CombatError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CombatError';
    this.code = code;
  }
}
