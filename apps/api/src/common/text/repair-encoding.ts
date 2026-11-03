/**
 * Repairs text that was decoded with the wrong codec (UTF-8 bytes read as
 * Windows-1252 / Latin-1).
 *
 * Symptoms: `â†'` instead of `→`, `â‚¹` instead of `₹`, `Â°` instead of `°`,
 * `âˆ A` instead of `∠ A`. The bytes were right; they were read with the wrong
 * codec once, so converting each character back to its byte and decoding the
 * result as UTF-8 restores the original text.
 *
 * The repair is deliberately conservative:
 *  - it only runs on text that contains a mojibake lead character;
 *  - every character must map back to a single byte (so nothing is guessed);
 *  - the result must round-trip exactly and must not contain U+FFFD;
 *  - if anything fails, the original is returned unchanged.
 */

/** Windows-1252 code points that are not the same as their Latin-1 byte. */
const CP1252_TO_BYTE = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

/** The lead characters of the sequences this repairs. */
const MOJIBAKE = /[ÃÂâð]/;

export function looksMojibake(value: string | null | undefined): boolean {
  if (!value) return false;
  return MOJIBAKE.test(value);
}

/** The bytes the text would have had if it were windows-1252, or null. */
function toCp1252Bytes(value: string): Buffer | null {
  const bytes = Buffer.alloc(value.length);
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const mapped = CP1252_TO_BYTE.get(code);
    if (mapped !== undefined) {
      bytes[i] = mapped;
      continue;
    }
    if (code > 0xff) return null; // a real character, not a mis-decoded byte
    bytes[i] = code;
  }
  return bytes;
}

/** windows-1252 decoding, used only for the round-trip check. */
function fromCp1252Bytes(bytes: Buffer): string {
  let out = '';
  for (const byte of bytes) {
    const special = [...CP1252_TO_BYTE].find(([, b]) => b === byte);
    out += special ? String.fromCharCode(special[0]) : String.fromCharCode(byte);
  }
  return out;
}

export function repairMojibake<T extends string | null | undefined>(value: T): T {
  if (typeof value !== 'string' || value.length === 0) return value;
  if (!looksMojibake(value)) return value;

  try {
    const bytes = toCp1252Bytes(value);
    if (!bytes) return value;

    const repaired = bytes.toString('utf8');
    if (repaired.includes('\uFFFD')) return value;
    if (repaired === value) return value;
    // Only accept an exactly reversible repair, so a genuine "é" or "°" that is
    // already correct is left alone.
    if (fromCp1252Bytes(Buffer.from(repaired, 'utf8')) !== value) return value;

    return repaired as T;
  } catch {
    return value;
  }
}
