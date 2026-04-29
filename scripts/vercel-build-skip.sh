#!/bin/bash
# Vercel Ignored Build Step
# Exit 0 = skip build. Exit 1 = proceed with build.

COMMIT_MSG=$(git log -1 --pretty=%B)

if echo "$COMMIT_MSG" | grep -qF "[skip vercel]"; then
  echo "Skipping: [skip vercel] tag found"
  exit 0
fi

if git diff HEAD^ HEAD --name-only | grep -qE \
  '^(src/|public/|next\.config\.|tailwind\.config\.|postcss\.config\.|package\.json|bun\.lock)'; then
  echo "Building: app code changed"
  exit 1
fi

echo "Skipping: no app code changed"
exit 0
