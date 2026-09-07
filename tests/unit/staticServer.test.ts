import { describe, expect, it } from 'vitest';
import { resolvePath } from '../../tools/e2e/static-server.mjs';

describe('static preview server boundaries', () => {
  it.each(['/../package.json', '/craftfocus/../../package.json', '/%2e%2e/package.json', '/..%5cpackage.json'])('rejects traversal: %s', (request) => {
    expect(resolvePath(request)).toEqual({ filePath: null, status: 403 });
  });

  it('rejects malformed URL encoding without crashing', () => {
    expect(resolvePath('/%zz')).toEqual({ filePath: null, status: 400 });
  });

  it('does not serve an HTML fallback for missing assets', () => {
    expect(resolvePath('/craftfocus/missing-script.js')).toEqual({ filePath: null, status: 404 });
  });
});
