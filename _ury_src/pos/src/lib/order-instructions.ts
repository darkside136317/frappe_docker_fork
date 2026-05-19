/** Max length aligned with typical POS Invoice Item comment fields. */
export const MAX_INSTRUCTION_LENGTH = 200;

export function normalizeInstruction(value: string | undefined | null): string {
  if (!value) return '';
  return value.trim().slice(0, MAX_INSTRUCTION_LENGTH);
}

/** Stable short key for cart line identity when instructions differ. */
export function instructionFingerprint(text: string): string {
  const normalized = normalizeInstruction(text);
  if (!normalized) return 'no-note';
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
  }
  return `note-${Math.abs(hash).toString(36)}`;
}
