const { readFileSync, writeFileSync } = require('node:fs');

// Expo SDK 54's consumers predate the patched dependencies' API changes.
// Remove these patches only when upstream consumers support those versions.
const patches = [
  {
    file: require.resolve('query-string'),
    before: "const decodeComponent = require('decode-uri-component');",
    after: "const decodeComponent = require('decode-uri-component').default;",
  },
  {
    file: require.resolve('metro/private/Assets'),
    before: 'const isImageInput = assetInfo.files[0].includes(".zip/")\n'
      + '    ? _fs.default.readFileSync(assetInfo.files[0])\n'
      + '    : assetInfo.files[0];',
    after: 'const isImageInput = isImage\n'
      + '    ? await _fs.default.promises.readFile(assetInfo.files[0])\n'
      + '    : null;',
  },
];

// Validate every source before writing, and fail on unexpected upstream changes.
const updates = patches.map(({ file, before, after }) => {
  const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const originals = source.split(before).length - 1;
  const patched = source.split(after).length - 1;
  if (originals === 0 && patched === 1) return null;
  if (originals !== 1 || patched !== 0) {
    throw new Error(`Security compatibility patch needs review: ${file}`);
  }
  return { file, source: source.replace(before, after) };
});

for (const update of updates) {
  if (update) writeFileSync(update.file, update.source);
}
