import crypto from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I for ease of typing in Minecraft chat

/**
 * Generate a cryptographically secure random alphanumeric code of given length.
 * Default 5 characters (e.g. "AJDE1", "ADTFE").
 */
export function generateSecureCode(length = 5): string {
  const bytes = crypto.randomBytes(length * 2);
  let code = '';
  for (let i = 0; i < bytes.length && code.length < length; i++) {
    const index = bytes[i] % CHARSET.length;
    code += CHARSET[index];
  }
  return code;
}
