const ITERATIONS = 100_000;

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createPasswordRecord(password: string): Promise<{ salt: string; hash: string }> {
  const salt = crypto.randomUUID();
  const hash = await hashPassword(password, salt);
  return { salt, hash };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const next = await hashPassword(password, salt);
  return next === hash;
}
