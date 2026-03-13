# Stop Putting Secrets in .env Files: Explain Like I'm 5

## The Big Question
You know how you have a house key, and you just leave it under the doormat? That's basically what developers do with their passwords and API keys — they stick them in a plain text `.env` file and hope nobody looks. This episode introduces Varlock, a tool that says "hey, maybe we should use an actual lock."

---

## What's Wrong With .env Files?

Your `.env` file is a plain text file sitting on your computer with all your secrets in it. Here's why that's bad:

- **AI agents read your files** — tools like Claude Code and Copilot slurp up everything, including that database password you forgot was in there
- **Tutorials teach bad habits** — every "Getting Started" guide says "step 1: put your API key in a .env file"
- **People copy-paste secrets in Slack** — because how else do you share them with teammates?
- **.env.example gets stale** — half the values are real, half are "PUT_YOUR_KEY_HERE", and nobody knows which is which
- **Streamers accidentally show them on screen** — one person racked up $3,000 in AI bills in an hour because someone saw their key

---

## What Is Varlock?

Varlock is a free, open-source tool that replaces `.env` files with a single schema file that:

| | Traditional .env | Varlock |
|---|---|---|
| **Format** | Plain key=value pairs | .env with JSDoc-style decorators |
| **Validation** | None (runtime explosion) | Schema validates on boot |
| **Types** | Everything is a string | Typed (boolean, email, URL, etc.) |
| **Secrets vs config** | No distinction | `@sensitive` marks secrets explicitly |
| **Documentation** | Separate README or .env.example | Inline `@docs` with links |
| **Source of truth** | Split across .env, .env.example, validation code, types | One file |

---

## How It Works

You write a `.env.schema` file that looks like a normal `.env` but with comments:

```
# @required @sensitive @type string @docs https://openai.com/api-keys
OPENAI_API_KEY=op("vault/item/field")  # fetches from 1Password

# @required @type number
PORT=3000

# @type boolean
FEATURE_FLAGS_ENABLED=true
```

Then Varlock:
1. **Validates** everything on startup — missing required vars fail immediately, not at random runtime
2. **Generates TypeScript types** — full IntelliSense with descriptions and even little SVG icons
3. **Fetches secrets** from 1Password, AWS, GCP, Azure via plugins — no more copy-pasting
4. **Redacts sensitive values** in console.log output automatically
5. **Blocks secrets from HTTP responses** — physically prevents leaking keys in API responses

---

## AI Agents and Secrets

For AI coding agents (Claude Code, etc.), Varlock lets you:
- Keep secrets **outside the repo** (e.g., `~/.env.claude` in your home folder)
- Use `varlock run claude` to inject only the keys the agent needs
- Prevent the agent from ever seeing or leaking the actual values

---

## Framework Integration

Varlock has plugins for Vite, Next.js, Astro, and others. You can keep using `process.env` — it just injects validated, typed values. Or use their `import { env } from 'varlock'` helper for coerced values (booleans are actual `true`/`false`, not strings).

It also works with **any language** via `varlock run` as a standalone binary, and supports GitHub Actions for CI validation.

---

## Business Model

- Core library is **free and open source forever** (MIT license, no rug pull)
- Revenue from enterprise features: hosted secret backend, audit logs, policy enforcement, automated secret rotation
- Backed by investors (Runway)
- Selected for GitHub's Secure Open Source Fund

---

## The One-Sentence Version
**Varlock replaces your scattered, untyped, insecure `.env` files with a single schema file that validates, types, fetches from secret managers, and prevents your secrets from leaking — for free.**
