import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('patched Expo dependency consumers', () => {
  it('parses encoded and malformed navigation query parameters', () => {
    const queryString = require('query-string');
    expect(queryString.parse('name=%E5%B0%88%E6%B3%A8&tag=a&tag=b')).toEqual({
      name: '專注', tag: ['a', 'b'],
    });
    expect(queryString.parse('value=%invalid')).toEqual({ value: '%invalid' });
  });

  it('reads image dimensions from a buffer through Metro', () => {
    const { getAssetSize } = require('metro/private/Assets');
    const file = fileURLToPath(new URL('../../assets/images/icon.png', import.meta.url));
    const content = readFileSync(file);
    expect(getAssetSize('png', content, file)).toEqual({
      width: content.readUInt32BE(16), height: content.readUInt32BE(20),
    });
    expect(getAssetSize('txt', content, file)).toBeNull();
  });

  it('reads file-backed image dimensions through Metro asset generation', async () => {
    const { getAssetData } = require('metro/private/Assets');
    const file = fileURLToPath(new URL('../../assets/images/icon.png', import.meta.url));
    const content = readFileSync(file);
    const asset = await getAssetData(file, 'assets/images/icon.png', [], null, '/assets');
    expect(asset.width).toBe(content.readUInt32BE(16));
    expect(asset.height).toBe(content.readUInt32BE(20));
    expect(asset.scales).toEqual([1]);
  });
});
