#!/bin/bash
set -e

echo "=== Harness Initialization ==="

echo "=== npx tsc --noEmit ==="
npx tsc --noEmit

echo "=== npm test ==="
npm test

echo "=== npm run e2e:build ==="
npm run e2e:build

echo "=== npm run test:e2e ==="
npm run test:e2e

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
