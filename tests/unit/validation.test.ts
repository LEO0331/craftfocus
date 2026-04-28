import { describe, expect, it } from 'vitest';

import {
  sanitizeText,
  validateEmail,
  validatePassword,
  validateSearchQuery,
  validateUsername,
} from '@/lib/validation';

describe('validation', () => {
  it('validates and normalizes email', () => {
    expect(validateEmail('  USER@Example.Com ')).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => validateEmail('')).toThrow('Enter a valid email address.');
    expect(() => validateEmail('abc')).toThrow('Enter a valid email address.');
  });

  it('validates password length', () => {
    expect(validatePassword('12345678')).toBe('12345678');
    expect(() => validatePassword('short')).toThrow('Password must be 8-128 characters.');
    expect(() => validatePassword('x'.repeat(129))).toThrow('Password must be 8-128 characters.');
  });

  it('validates username format', () => {
    expect(validateUsername('craft_focus_99')).toBe('craft_focus_99');
    expect(() => validateUsername('a')).toThrow('Username must be 3-24 chars');
    expect(() => validateUsername('bad name')).toThrow('Username must be 3-24 chars');
    expect(() => validateUsername('x'.repeat(25))).toThrow('Username must be 3-24 chars');
  });

  it('sanitizes text and enforces max length', () => {
    expect(sanitizeText('  hello   world  ', 20)).toBe('hello world');
    expect(() => sanitizeText('x'.repeat(21), 20)).toThrow('Input exceeds maximum length (20).');
  });

  it('validates search query length', () => {
    expect(validateSearchQuery('  abc ')).toBe('abc');
    expect(() => validateSearchQuery('x'.repeat(41))).toThrow('Search query is too long.');
  });
});
