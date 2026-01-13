#!/bin/bash
set -e

BRANCH_NAME="test/js-area-$(date +%s)"
git checkout -b "$BRANCH_NAME"

echo "// change $(date)" >> foo.ts
git add foo.ts
git commit -m "feat: modify typescript file"
git push -u origin "$BRANCH_NAME"

gh pr create \
  --label "area-test" \
  --draft \
  --title "feat: Update JS Logic" \
  --body "This PR modifies \`foo.ts\`.

Expected:
- \`area:javascript\` label
- \`team:glowing-potato-feds\` label
- \`team:glowing-potato-admins\` label
- Blocking review from \`glowing-potato-feds\`
- Non-blocking review from \`glowing-potato-admins\`" \
  --base main

git checkout main
