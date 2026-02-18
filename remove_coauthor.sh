#!/bin/bash
# Script to remove Co-Authored-By lines from git history
# WARNING: This rewrites git history. Only use if you're the sole contributor.

echo "🔍 Checking repository status..."
echo ""

# Count commits with co-author
COAUTHOR_COUNT=$(git log --all --grep="Co-Authored-By" --oneline | wc -l | tr -d ' ')
echo "Found $COAUTHOR_COUNT commits with Co-Authored-By attribution"
echo ""

# Get the oldest commit with co-author
OLDEST_COMMIT=$(git log --all --grep="Co-Authored-By" --format="%h" | tail -1)
echo "Oldest commit with co-author: $OLDEST_COMMIT"
echo ""

# Get the parent of the oldest commit (where we'll start the rebase)
REBASE_START=$(git rev-parse ${OLDEST_COMMIT}^)
echo "Will rebase from: $REBASE_START"
echo ""

echo "⚠️  WARNING: This will rewrite git history!"
echo "   - All commit SHAs will change from $OLDEST_COMMIT onwards"
echo "   - You will need to force push to GitHub: git push --force origin main"
echo "   - Anyone who has cloned this repo will need to re-clone or reset"
echo ""
echo "Commits that will be affected:"
git log --all --grep="Co-Authored-By" --oneline
echo ""

read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Aborted. No changes made."
    exit 0
fi

echo ""
echo "🔄 Starting rebase to remove Co-Authored-By lines..."
echo ""

# Use filter-branch to remove co-author lines from all commit messages
git filter-branch --msg-filter '
    sed "/Co-Authored-By: Claude Sonnet 4.5/d"
' -- ${REBASE_START}..HEAD

echo ""
echo "✅ Done! Co-Authored-By lines removed from commit history."
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes: git log --oneline -20"
echo "   2. Force push to GitHub: git push --force origin main"
echo "   3. Verify on GitHub that commits look correct"
echo ""
echo "⚠️  Note: If anything goes wrong, you can restore the original state with:"
echo "   git reset --hard refs/original/refs/heads/main"
echo "   (This backup reference will exist for 30 days)"
echo ""
