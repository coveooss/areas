#!/bin/bash
set -e

BRANCH_NAME="test/multi-area-$(date +%s)"
git checkout -b "$BRANCH_NAME"

echo "# change $(date)" >> foo.rb
echo "// change $(date)" >> foo.ts
git add foo.rb foo.ts
git commit -m "feat: modify ruby and typescript files"
git push -u origin "$BRANCH_NAME"

gh pr create \
  --label "area-test" \
  --draft \
  --title "feat: Update Ruby and JS Logic" \
  --body "This PR modifies \`foo.rb\` and \`foo.ts\`.

Expected:
- \`area:ruby\` label
- \`area:javascript\` label
- \`team:glowing-potato-feds\` label
- \`team:glowing-potato-rubyist\` label
- \`team:glowing-potato-admins\` label
- Blocking review from \`glowing-potato-feds\`
- Non-blocking review from \`glowing-potato-admins\` and \`glowing-potato-rubyist\`" \
  --base main

git checkout main
