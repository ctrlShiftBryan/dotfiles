/**
 * LLM agent runners for commit message generation.
 */

import { tryRun } from '../lib/io'

export const DEFAULT_COMMAND = 'claude -p --model haiku'

export const DEFAULT_TITLE_PROMPT = `You have 10 seconds. Write a single-line git commit headline (max 72 chars) from this coding session transcript. Speed over perfection — a rough title beats no title.

Rules:
- Conventional Commit format: type(scope): subject  or  type: subject
- Allowed types: feat, fix, chore, refactor, docs, test, perf
- Subject in imperative mood, lowercase start, no trailing period
- Scope is optional — use when it clarifies the change

Transcript:
{{transcript}}

Respond with ONLY the headline, nothing else. Do not deliberate.`

export const DEFAULT_BODY_PROMPT = `Given this transcript of a coding session, write summaries.

Rules:
- Write one short summary (1-2 sentences) per turn describing what was done
- Write one overall summary (1-3 sentences) for the entire commit
- Use the exact format below — parseable markers are critical

Format:
TURN 1: <summary of what was done for turn 1>
TURN 2: <summary of what was done for turn 2>
OVERALL: <overall summary of the commit>

Transcript:
{{transcript}}

Respond with ONLY the formatted summaries, nothing else.`

export const DEFAULT_TLDR_PROMPT = `Summarize this coding session. Focus on WHAT was accomplished.
- Short sessions (1-2 turns): 1-2 sentences
- Medium (3-5 turns): 2-3 sentences
- Long (6+ turns): 3-5 sentences
Be specific: mention features, files, bugs.

{{transcript}}

Respond with ONLY the summary, nothing else.`

export const DEFAULT_REWORD_PROMPT = `Review these git commits from one coding session. Rewrite each message for consistency and coherence.
Keep conventional commit format (type(scope): subject). Each commit should remain distinct (don't merge them).
Return in the same numbered order using this exact format:
COMMIT 1: <full message>
COMMIT 2: <full message>

Session context: {{context}}

{{commits}}

Respond with ONLY the reworded commits, nothing else.`

export const DEFAULT_CONDENSE_PROMPT = `Summarize this CI/build/lint output in 2-4 sentences.
Focus on: what checks ran, what passed, what failed, and key error details.
Do not include raw logs or file paths.

Output:
{{transcript}}

Respond with ONLY the summary, nothing else.`

export interface AgentConfig {
  command?: string
  prompt?: string
  type?: string
  maxLineLength?: number
  minLength?: number
  enabled?: boolean
}

/**
 * Replace {{transcript}} placeholders in a template string.
 */
export function renderPrompt(template: string, transcript: string): string {
  return template.replace(/\{\{transcript\}\}/g, () => transcript)
}

/**
 * Spawn an agent command with the given prompt as stdin.
 * Returns trimmed output or null on failure.
 */
export function runAgent(root: string, command: string, prompt: string): string | null {
  const binary = command.split(/\s+/)[0]
  const whichResult = tryRun(`which ${binary}`, {})
  if (whichResult.code !== 0) return null

  const result = tryRun(command, {
    cwd: root,
    timeout: 45000,
    input: prompt,
    env: { ...process.env as Record<string, string>, FOLDERAI_DISABLED: '1', CLAUDECODE: '' }
  })

  if (result.code !== 0) return null

  const output = result.stdout.trim() || result.stderr.trim()
  return output || null
}

/**
 * Run title generation agent. Enforces 72 char limit on first line.
 */
export function runTitleAgent(root: string, titleCfg: AgentConfig, transcript: string): string | null {
  const command = titleCfg.command || DEFAULT_COMMAND
  const template = titleCfg.prompt || DEFAULT_TITLE_PROMPT
  const prompt = renderPrompt(template, transcript)
  const result = runAgent(root, command, prompt)
  if (!result) return null
  return result.split('\n')[0].slice(0, 72) || null
}

/**
 * Run body generation agent.
 */
export function runBodyAgent(root: string, bodyCfg: AgentConfig, transcript: string): string | null {
  const command = bodyCfg.command || DEFAULT_COMMAND
  const template = bodyCfg.prompt || DEFAULT_BODY_PROMPT
  const prompt = renderPrompt(template, transcript)
  return runAgent(root, command, prompt)
}

/**
 * Run condense agent for CI/build output summarization.
 */
export function runCondenseAgent(root: string, condenseCfg: AgentConfig, text: string): string | null {
  const command = condenseCfg.command || DEFAULT_COMMAND
  const template = condenseCfg.prompt || DEFAULT_CONDENSE_PROMPT
  const prompt = renderPrompt(template, text)
  return runAgent(root, command, prompt)
}

/**
 * Run TLDR generation agent for session summary.
 */
export function runTldrAgent(root: string, command: string, promptTemplate: string, transcript: string): string | null {
  const prompt = renderPrompt(promptTemplate, transcript)
  return runAgent(root, command, prompt)
}

/**
 * Run reword agent for holistic commit message rewriting.
 */
export function runRewordAgent(root: string, command: string, promptTemplate: string, context: string, commitsText: string): string | null {
  const prompt = promptTemplate
    .replace(/\{\{context\}\}/g, () => context)
    .replace(/\{\{commits\}\}/g, () => commitsText)
  return runAgent(root, command, prompt)
}

/**
 * Parse reword agent output into individual commit messages.
 * Expects format: COMMIT 1: <message>\nCOMMIT 2: <message>\n...
 */
export function parseRewordOutput(output: string, count: number): string[] | null {
  const messages: string[] = []
  const parts = output.split(/^COMMIT \d+:\s*/m).filter(Boolean)
  if (parts.length !== count) return null
  for (const part of parts) {
    const msg = part.trim()
    if (!msg) return null
    messages.push(msg)
  }
  return messages
}
