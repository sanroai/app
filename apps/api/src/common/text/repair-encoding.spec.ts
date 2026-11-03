import { describe, it, expect } from 'vitest';
import { looksMojibake, repairMojibake } from './repair-encoding';

describe('repairMojibake', () => {
  it('restores a right arrow', () => {
    expect(repairMojibake('CaO + CO2 â†’ CaCO3')).toBe('CaO + CO2 → CaCO3');
  });

  it('restores a rupee sign', () => {
    expect(repairMojibake('â‚¹8,000')).toBe('₹8,000');
  });

  it('restores a degree sign', () => {
    expect(repairMojibake('95Â°')).toBe('95°');
  });

  it('restores an angle sign that consumed the following byte', () => {
    // The third UTF-8 byte of ∠ is 0xA0, which shows up as a non-breaking space:
    // repairing it merges the sign with the next character, faithfully.
    expect(repairMojibake('âˆ\u00A0A = 95Â°')).toBe('∠A = 95°');
  });

  it('leaves an unrecoverable sequence alone rather than guessing', () => {
    // A normal space where the byte had to be 0xA0 cannot round-trip, so the
    // original is returned unchanged.
    expect(repairMojibake('âˆ A = 95Â°')).toBe('âˆ A = 95Â°');
  });

  it('leaves clean text alone', () => {
    for (const value of ['CaO + CO2 -> CaCO3', '95°', '₹8,000', '∠ A = 95°', 'a café', '']) {
      expect(repairMojibake(value)).toBe(value);
    }
  });

  it('leaves null and undefined alone', () => {
    expect(repairMojibake(null)).toBeNull();
    expect(repairMojibake(undefined)).toBeUndefined();
  });

  it('detects the sequences it can repair', () => {
    expect(looksMojibake('â†’')).toBe(true);
    expect(looksMojibake('→')).toBe(false);
    expect(looksMojibake('')).toBe(false);
  });
});
