const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

export function validateEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!value || value.length > 254 || !value.includes('@')) {
    throw new Error('Enter a valid email address.');
  }
  return value;
}

export function validatePassword(password: string): string {
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must be 8-128 characters.');
  }
  return password;
}

export function validateUsername(username: string): string {
  const value = username.trim();
  if (!USERNAME_REGEX.test(value)) {
    throw new Error('Username must be 3-24 chars (letters, numbers, underscore).');
  }
  return value;
}

export function sanitizeText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length > maxLength) {
    throw new Error(`Input exceeds maximum length (${maxLength}).`);
  }
  return normalized;
}

export function validateSearchQuery(value: string): string {
  const normalized = value.trim();
  if (normalized.length > 40) {
    throw new Error('Search query is too long.');
  }
  return normalized;
}
