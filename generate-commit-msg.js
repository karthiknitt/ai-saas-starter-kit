/* eslint-disable no-undef */

import { execSync } from 'child_process';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import 'dotenv/config';

async function generateCommitMessage() {
  try {
    // Get git diff
    const diff = execSync('git diff --staged --no-color', { encoding: 'utf8' });

    if (!diff.trim()) {
      console.error('No staged changes');
      process.exit(1);
    }

    // Truncate very large diffs to avoid token limits
    // Rough estimate: 1 token ≈ 4 chars, keep under ~100k tokens for safety
    const maxChars = 400000; // ~100k tokens
    let truncatedDiff = diff;
    if (diff.length > maxChars) {
      truncatedDiff = diff.substring(0, maxChars) + '\n\n[... diff truncated due to length ...]';
      console.error('Warning: Diff is very large and was truncated');
    }

    const prompt = `Generate a single conventional commit message for the following git diff. Follow the format: type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Keep it concise and lowercase. Output only the commit message, no code blocks or extra text.

Diff:
${truncatedDiff}`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    console.log(text.trim());
  } catch (error) {
    console.error('Error generating commit message:', error.message);
    process.exit(1);
  }
}

await generateCommitMessage();