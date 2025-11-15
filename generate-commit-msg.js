/* eslint-disable no-undef */

import { execSync } from 'node:child_process';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import 'dotenv/config';

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

async function generateCommitMessage() {
  try {
    // Get git diff, limited to prevent context window issues
    const fullDiff = execSync('git diff --staged --no-color', {
      encoding: 'utf8',
    });

    if (!fullDiff.trim()) {
      console.error('No staged changes');
      process.exit(1);
    }

    // Truncate diff to first 2000 lines to stay within context limits
    const diffLines = fullDiff.split('\n');
    const truncatedDiff = diffLines.slice(0, 2000).join('\n');
    const diff =
      truncatedDiff + (diffLines.length > 2000 ? '\n... (diff truncated)' : '');

    const prompt = `Generate a single conventional commit message for the following git diff. Follow the format: type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Keep it concise and lowercase. Output only the commit message, no code blocks or extra text.

Diff:
${diff}`;

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
