/* eslint-disable no-undef */

import { execSync } from 'child_process';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import 'dotenv/config';

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

async function generateCommitMessage() {
  try {
    // Get git diff
    const diff = execSync('git diff --staged --no-color', { encoding: 'utf8' });

    if (!diff.trim()) {
      console.error('No staged changes');
      process.exit(1);
    }

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