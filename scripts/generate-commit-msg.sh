#!/bin/bash

# Get the root directory of the git repository
GIT_ROOT=$(git rev-parse --show-toplevel)

# Run the commit message generator from the root directory
cd "$GIT_ROOT" || exit 0

# Generate commit message and capture output
COMMIT_MSG=$(node generate-commit-msg.js 2>&1)
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "Warning: Failed to generate commit message: $COMMIT_MSG" >&2
  exit 0
fi

if [ -n "$COMMIT_MSG" ] && [ -n "$1" ]; then
  echo "$COMMIT_MSG" > "$1"
elif [ -z "$COMMIT_MSG" ]; then
  echo "Warning: No commit message generated (no staged changes?)" >&2
fi