#!/usr/bin/env python3
"""Fetch YouTube transcripts and metadata via yt-dlp. Outputs 3 files + JSON summary."""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def extract_video_id(url: str) -> str:
    """Extract video ID from any YouTube URL format or raw ID."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/|/shorts/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return url


def sanitize_title(title: str, max_len: int = 50) -> str:
    """Lowercase, hyphens, alphanumeric only, max length."""
    s = title.lower()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s]+', '-', s).strip('-')
    s = re.sub(r'-+', '-', s)
    return s[:max_len].rstrip('-')


def fetch_metadata(url: str) -> dict:
    """Fetch video metadata via yt-dlp --dump-json."""
    cmd = ["yt-dlp", "--dump-json", "--no-download", url]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error fetching metadata: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    data = json.loads(result.stdout)
    duration = data.get("duration", 0)
    mins, secs = divmod(int(duration), 60)
    hours, mins = divmod(mins, 60)
    dur_str = f"{hours}:{mins:02d}:{secs:02d}" if hours else f"{mins}:{secs:02d}"
    upload = data.get("upload_date", "")
    if len(upload) == 8:
        upload = f"{upload[:4]}-{upload[4:6]}-{upload[6:8]}"
    return {
        "video_id": data.get("id", ""),
        "title": data.get("title", ""),
        "channel": data.get("channel", data.get("uploader", "")),
        "duration": duration,
        "duration_string": dur_str,
        "upload_date": upload,
        "description": data.get("description", ""),
        "url": data.get("webpage_url", url),
        "view_count": data.get("view_count", 0),
    }


def fetch_subtitles(url: str, lang: str, temp_dir: str) -> Path:
    """Download subtitles via yt-dlp, return path to VTT file."""
    cmd = [
        "yt-dlp",
        "--write-subs", "--write-auto-subs",
        "--skip-download",
        "--sub-lang", lang,
        "--output", "subs",
        url,
    ]
    result = subprocess.run(cmd, cwd=temp_dir, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error fetching subtitles: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    vtt_files = list(Path(temp_dir).glob("*.vtt"))
    if not vtt_files:
        print("No subtitles found for this video.", file=sys.stderr)
        sys.exit(1)
    return vtt_files[0]


def parse_vtt_timestamp(ts: str) -> float:
    """Convert HH:MM:SS.mmm or MM:SS.mmm to seconds."""
    parts = ts.strip().split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return 0.0


def parse_vtt_segments(content: str) -> list:
    """Parse VTT into timestamped segments [{text, start, end}]."""
    segments = []
    timestamp_re = re.compile(
        r'(\d{1,2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{1,2}:\d{2}:\d{2}\.\d{3})'
    )
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        m = timestamp_re.match(lines[i].strip())
        if m:
            start = parse_vtt_timestamp(m.group(1))
            end = parse_vtt_timestamp(m.group(2))
            text_lines = []
            i += 1
            while i < len(lines) and lines[i].strip():
                line = re.sub(r'<[^>]+>', '', lines[i].strip())
                if line:
                    text_lines.append(line)
                i += 1
            text = " ".join(text_lines)
            if text and (not segments or segments[-1]["text"] != text):
                segments.append({"text": text, "start": round(start, 3), "end": round(end, 3)})
        else:
            i += 1
    return segments


def clean_vtt(content: str) -> str:
    """Clean VTT to plain text — dedup lines, strip tags/timestamps."""
    lines = content.splitlines()
    text_lines = []
    timestamp_re = re.compile(r'\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}')
    for line in lines:
        line = line.strip()
        if not line or line == "WEBVTT" or line.isdigit():
            continue
        if timestamp_re.match(line):
            continue
        if line.startswith("NOTE") or line.startswith("STYLE") or line.startswith("Kind:") or line.startswith("Language:"):
            continue
        if text_lines and text_lines[-1] == line:
            continue
        line = re.sub(r'<[^>]+>', '', line)
        if line:
            text_lines.append(line)
    # Merge into paragraphs: join consecutive lines, split on sentence boundaries
    merged = " ".join(text_lines)
    # Split into ~paragraph-sized chunks at sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', merged)
    paragraphs = []
    current = []
    for s in sentences:
        current.append(s)
        if len(current) >= 4:
            paragraphs.append(" ".join(current))
            current = []
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def write_files(metadata: dict, segments: list, plain_text: str, output_dir: str) -> dict:
    """Write .txt, .json, .md files. Return dict of file paths."""
    os.makedirs(output_dir, exist_ok=True)
    title_slug = sanitize_title(metadata["title"])
    vid = metadata["video_id"]
    base = f"{title_slug}-{vid}"
    paths = {}

    # .txt
    txt_path = os.path.join(output_dir, f"{base}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(plain_text)
    paths["txt"] = txt_path

    # .json
    json_path = os.path.join(output_dir, f"{base}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"metadata": metadata, "segments": segments}, f, indent=2, ensure_ascii=False)
    paths["json"] = json_path

    # .md
    md_path = os.path.join(output_dir, f"{base}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# {metadata['title']}\n\n")
        f.write("| Field | Value |\n|-------|-------|\n")
        f.write(f"| Channel | {metadata['channel']} |\n")
        f.write(f"| Duration | {metadata['duration_string']} |\n")
        f.write(f"| Uploaded | {metadata['upload_date']} |\n")
        f.write(f"| Views | {metadata.get('view_count', 'N/A'):,} |\n")
        f.write(f"| URL | {metadata['url']} |\n\n")
        f.write("## Transcript\n\n")
        f.write(plain_text)
        f.write("\n")
    paths["md"] = md_path

    return paths


def main():
    parser = argparse.ArgumentParser(description="Fetch YouTube transcript + metadata via yt-dlp")
    parser.add_argument("url", help="YouTube video URL or video ID")
    parser.add_argument("--lang", default="en", help="Subtitle language code (default: en)")
    parser.add_argument("--output-dir", default="transcripts", help="Output directory (default: transcripts/)")
    args = parser.parse_args()

    if not shutil.which("yt-dlp"):
        print("Error: yt-dlp not found. Install with: brew install yt-dlp", file=sys.stderr)
        sys.exit(2)

    metadata = fetch_metadata(args.url)

    with tempfile.TemporaryDirectory() as temp_dir:
        vtt_path = fetch_subtitles(args.url, args.lang, temp_dir)
        content = vtt_path.read_text(encoding="utf-8")
        segments = parse_vtt_segments(content)
        plain_text = clean_vtt(content)

    paths = write_files(metadata, segments, plain_text, args.output_dir)

    summary = {
        "metadata": metadata,
        "files": paths,
        "segment_count": len(segments),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
