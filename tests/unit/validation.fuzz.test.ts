import { describe, expect, it } from 'vitest';

import {
  sanitizeText,
  validateEmail,
  validatePassword,
  validateSearchQuery,
  validateUsername,
} from '@/lib/validation';

function randomString(len: number) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\\'" \n\t';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

describe('validation fuzz smoke', () => {
  it('sanitizers and validators remain bounded under randomized inputs', () => {
    for (let i = 0; i < 250; i += 1) {
      const raw = randomString(Math.floor(Math.random() * 120));
      const normalized = raw.replace(/\s+/g, ' ').trim();

      if (normalized.length <= 20) {
        expect(sanitizeText(raw, 20).length).toBeLessThanOrEqual(20);
      } else {
        expect(() => sanitizeText(raw, 20)).toThrow();
      }

      if (normalized.length <= 60) {
        expect(sanitizeText(raw, 60).length).toBeLessThanOrEqual(60);
      } else {
        expect(() => sanitizeText(raw, 60)).toThrow();
      }

      if (normalized.length <= 40) {
        expect(validateSearchQuery(raw).length).toBeLessThanOrEqual(40);
      } else {
        expect(() => validateSearchQuery(raw)).toThrow();
      }
    }
  });

  it('email/password validators handle mixed valid-invalid samples', () => {
    const validEmails = ['a@b.co', 'codex@test.com', 'user.name+tag@domain.io', 'x@y'];
    const invalidEmails = ['', 'abc', 'domain.com', 'user.domain'];

    validEmails.forEach((email) => {
      expect(validateEmail(email)).toBe(email.toLowerCase());
    });
    invalidEmails.forEach((email) => {
      expect(() => validateEmail(email)).toThrow();
    });

    const validPasswords = ['codexcodex', 'A1b2c3d4', '12345678'];
    const invalidPasswords = ['', '123', 'abc', '1234567'];

    validPasswords.forEach((password) => {
      expect(validatePassword(password)).toBe(password);
    });
    invalidPasswords.forEach((password) => {
      expect(() => validatePassword(password)).toThrow();
    });

    const validUsernames = ['codex_01', 'Leo331', 'abc'];
    const invalidUsernames = ['ab', 'x-y', 'space name', '漢字'];

    validUsernames.forEach((username) => {
      expect(validateUsername(username)).toBe(username);
    });
    invalidUsernames.forEach((username) => {
      expect(() => validateUsername(username)).toThrow();
    });
  });
});
