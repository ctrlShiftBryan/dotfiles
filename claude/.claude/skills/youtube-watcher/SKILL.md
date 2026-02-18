---
name: youtube-watcher
description: Use when the user shares a YouTube URL, asks to summarize a video, requests a video transcript, or wants to extract information from a YouTube video
---

# YouTube Watcher

Fetches YouTube video transcripts as phrase-level JSON segments or plain text.

## Prerequisites

Run once from the scripts directory:
```bash
cd ~/.claude/skills/youtube-watcher/scripts && npm install
```

## Usage

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/youtube-watcher/SKILL.md)")"
node "$SKILL_DIR/scripts/get_transcript.mjs" "YOUTUBE_URL"
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--format json` | yes | JSON array of `{text, start, duration}` segments |
| `--format text` | | Clean plain text, one line per segment |
| `--lang CODE` | `en` | Subtitle language code |

### Examples

JSON output (default):
```bash
node "$SKILL_DIR/scripts/get_transcript.mjs" "https://www.youtube.com/watch?v=VIDEO_ID"
```

Plain text:
```bash
node "$SKILL_DIR/scripts/get_transcript.mjs" "https://www.youtube.com/watch?v=VIDEO_ID" --format text
```

Spanish subtitles:
```bash
node "$SKILL_DIR/scripts/get_transcript.mjs" "https://www.youtube.com/watch?v=VIDEO_ID" --lang es
```

## Python Alternative

A Python script (`get_transcript.py`) is also available, requiring `pip3 install youtube-transcript-api`.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — transcript printed to stdout |
| 1 | Error — fetch failed, bad URL, or no subtitles found |

## Common Mistakes

- Do NOT run the script without a URL argument
- Do NOT assume the video has subtitles — check exit code
- Do NOT forget to quote the URL (URLs contain special shell characters)
