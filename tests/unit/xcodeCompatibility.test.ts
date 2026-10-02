import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('Expo Xcode dependency compatibility', () => {
  it('generates unique project identifiers through the CommonJS UUID consumer', () => {
    const xcode = require('xcode');
    const project = xcode.project('compatibility.pbxproj');
    project.hash = { project: { objects: { PBXGroup: {} } } };

    const identifiers = new Set<string>();
    for (let index = 0; index < 100; index += 1) {
      const identifier = project.generateUuid();
      expect(identifier).toMatch(/^[0-9A-F]{24}$/);
      expect(identifiers.has(identifier)).toBe(false);
      identifiers.add(identifier);
      project.hash.project.objects.PBXGroup[identifier] = {};
    }
  });
});
