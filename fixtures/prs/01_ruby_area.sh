#!/bin/bash
set -e

BRANCH_NAME="test/ruby-area-$(date +%s)"
git checkout -b "$BRANCH_NAME"

echo "# change $(date)" >> foo.rb
git add foo.rb
git commit -m "feat: modify ruby file"
git push -u origin "$BRANCH_NAME"

gh pr create \
  --label "area-test" \
  --draft \
  --title "feat: Update Ruby Logic" \
  --body "This PR modifies \`foo.rb\`.

Expected:
- \`area:ruby\` label
- \`team:glowing-potato-rubyist\` label
- Non-blocking review from \`glowing-potato-rubyist\`" \
  --base main

git checkout main
