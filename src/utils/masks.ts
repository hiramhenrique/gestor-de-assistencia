export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, prefix, suffix) => suffix ? `(${ddd}) ${prefix}-${suffix}` : `(${ddd}) ${prefix}`)
      .replace(/\s+$/, '');
  }

  return digits
    .replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, prefix, suffix) => suffix ? `(${ddd}) ${prefix}-${suffix}` : `(${ddd}) ${prefix}`)
    .replace(/\s+$/, '');
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^([0-9])\1+$/.test(digits)) return false;
  return true;
}

export function getWhatsAppTarget(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `55${digits}`;
  if (digits.length === 11) return digits.startsWith('55') ? digits : `55${digits}`;
  return null;
}

export function maskPhone(value: string): string {
  return normalizePhone(value);
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskDate(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10]);
}
