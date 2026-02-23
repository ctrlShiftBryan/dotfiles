---
name: youtube-playlists
description: Create and manage YouTube playlists. Use when user wants to create a playlist, add videos to playlists, list playlists, remove videos, view liked videos, or manage subscriptions.
---

# YouTube Playlists

Manage YouTube playlists via OAuth 2.0 + YouTube Data API v3. All commands output JSON to stdout.

## Prerequisites

1. Place `credentials.json` (Google Cloud OAuth Desktop App) in `~/.claude/skills/youtube-playlists/`
2. Enable **YouTube Data API v3** in your Google Cloud project
3. Install dependencies (once):
```bash
cd ~/.claude/skills/youtube-playlists/scripts && npm install
```
4. Authenticate (opens browser once):
```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/youtube-playlists/SKILL.md)")"
node "$SKILL_DIR/scripts/yt_playlist.mjs" auth
```

## Usage

```bash
SKILL_DIR="$(dirname "$(readlink -f ~/.claude/skills/youtube-playlists/SKILL.md)")"
```

### Auth

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" auth
```

### Create playlist

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" create "My Playlist"
node "$SKILL_DIR/scripts/yt_playlist.mjs" create "My Playlist" --description "desc" --privacy unlisted
```

### Add video to playlist

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" add <playlist_id> <video_id_or_url>
```

### Bulk create (playlist + videos in one command)

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" bulk-create "Playlist Title" dQw4w9WgXcQ oHg5SJYRHA0
node "$SKILL_DIR/scripts/yt_playlist.mjs" bulk-create "Playlist Title" \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  "https://youtu.be/oHg5SJYRHA0" \
  --privacy private
```

### List playlists

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" list
node "$SKILL_DIR/scripts/yt_playlist.mjs" list --max 10
```

### Remove video from playlist

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" remove <playlist_id> <video_id_or_url>
```

### List videos in a playlist

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" videos <playlist_id>
node "$SKILL_DIR/scripts/yt_playlist.mjs" videos <playlist_id> --max 100
```

### Liked videos

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" liked
node "$SKILL_DIR/scripts/yt_playlist.mjs" liked --max 20
```

### Subscriptions

```bash
node "$SKILL_DIR/scripts/yt_playlist.mjs" subscriptions
node "$SKILL_DIR/scripts/yt_playlist.mjs" subscriptions --max 100
```

## Input

- Video args accept full URLs (`youtube.com/watch?v=...`, `youtu.be/...`) or raw video IDs
- Default privacy: `private` for `create`, `unlisted` for `bulk-create`

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — JSON output on stdout |
| 1 | Error — JSON `{ "error": "..." }` on stdout |

## Notes

- API quota: 10,000 units/day. `playlistItems.insert` costs 50 units each.
- Port 8080 must be free during initial `auth` command.
- Token is cached in `token.json` and auto-refreshed.
