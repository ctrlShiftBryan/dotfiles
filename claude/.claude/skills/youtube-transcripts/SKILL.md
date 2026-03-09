---
name: youtube-transcripts
description: >
  Fetch YouTube video transcripts, save in multiple formats, and generate summaries.
  Use when user shares a YouTube URL, asks to summarize a video, requests a transcript,
  or wants to extract information from a YouTube video. Also triggers on "watch this",
  "what does this video say", or any youtube.com/youtu.be link.
---

# YouTube Transcripts

Fetches YouTube video transcripts and metadata via yt-dlp. Saves in 3 formats (txt, json, md) and generates an ELI5 summary.

## Prerequisites

- `yt-dlp` installed (`brew install yt-dlp`)
- Python 3 (no pip packages needed)

## Usage

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/youtube-transcripts/SKILL.md)")"
python3 "$SKILL_DIR/scripts/yt_transcript.py" "YOUTUBE_URL" --output-dir transcripts/
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--lang CODE` | `en` | Subtitle language code |
| `--output-dir DIR` | `transcripts/` | Output directory for saved files |

## Workflow

When a user shares a YouTube URL or asks about a video:

1. Run the script:
   ```bash
   SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/youtube-transcripts/SKILL.md)")"
   python3 "$SKILL_DIR/scripts/yt_transcript.py" "<url>" --output-dir transcripts/
   ```
2. Parse the JSON output from stdout to get file paths and metadata
3. Read the `.txt` file to get the full transcript content
4. Generate an ELI5 summary and write it to `{base}-eli5.md` in the same output directory
5. Report all 4 files to the user with a brief summary of what the video covers

## ELI5 Summary Format

Write the ELI5 summary following this template:

```markdown
# [Descriptive Title]: Explain Like I'm 5

## The Big Question
[One paragraph framing the core topic in simple terms]

---

## [Section 1 Title]
[Break content into digestible sections]
[Use analogies and real-world examples]
[Keep language simple and conversational]

---

## [Section 2 Title]
[Continue breaking down concepts]
[Include comparison tables where applicable]

| | Option A | Option B |
|---|---|---|
| **Aspect** | Simple explanation | Simple explanation |

---

## The One-Sentence Version
**[Single sentence capturing the core insight in plain language]**
```

Key principles for the ELI5:
- Use analogies and metaphors to explain complex concepts
- Break content into short, digestible sections with clear headers
- Include comparison tables where they help clarify differences
- End with a single-sentence summary
- Write as if explaining to a curious friend, not a textbook

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — files written, JSON summary on stdout |
| 1 | Error — no subtitles, private video, or yt-dlp failure |
| 2 | yt-dlp not installed |

## Output Files

The script creates 3 files in the output directory:
- `{title}-{video-id}.txt` — Clean plain text transcript
- `{title}-{video-id}.json` — Metadata + timestamped segments
- `{title}-{video-id}.md` — Markdown with metadata table + transcript

Claude generates the 4th file:
- `{title}-{video-id}-eli5.md` — ELI5 summary

## Common Mistakes

- Do NOT run the script without a URL argument
- Do NOT assume the video has subtitles — check exit code
- Do NOT forget to quote the URL (URLs contain special shell characters)
- Do NOT skip generating the ELI5 summary — always create it after fetching the transcript
