#!/bin/bash

COMMIT_MSG=$(node generate-commit-msg.js 2>&1)
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "Warning: Failed to generate commit message: $COMMIT_MSG" >&2
  exit 0
fi

if [ -n "$COMMIT_MSG" ]; then
  echo "$COMMIT_MSG" > "$1"
else
  echo "Warning: No commit message generated (no staged changes?)" >&2
fi