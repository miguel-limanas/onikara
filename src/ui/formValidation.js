export function required(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function minNumber(value, min) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min;
}

export function validateRecord(values, fields) {
  const errors = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.required && !required(value)) {
      errors[field.name] = 'Campo obrigatório.';
      continue;
    }
    if (field.type === 'number' && required(value) && !minNumber(value, field.min ?? Number.NEGATIVE_INFINITY)) {
      errors[field.name] = `Informe um numero ${field.min !== undefined ? `maior ou igual a ${field.min}` : 'valido'}.`;
    }
    if (field.type === 'json' && required(value)) {
      try {
        JSON.parse(value);
      } catch {
        errors[field.name] = 'JSON invalido.';
      }
    }
  }
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
