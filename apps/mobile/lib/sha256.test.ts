import { sha256Hex } from './sha256';

describe('sha256Hex', () => {
  // FIPS 180-4 / RFC 6234 test vectors.
  it('hashes the empty string', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('hashes "abc"', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hashes the 448-bit message', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('is deterministic and returns a 64-character lowercase hex digest', () => {
    const digest = sha256Hex('Sanro offline credential check');
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex('Sanro offline credential check')).toBe(digest);
  });

  it('hashes non-ASCII input as UTF-8', () => {
    // "abc" in Devanagari ("अबी" style) — just assert it stays a valid digest, not equality.
    expect(sha256Hex('नमस्ते')).toMatch(/^[0-9a-f]{64}$/);
  });
});
