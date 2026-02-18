#!/usr/bin/env python3
import argparse
import json
import sys

from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url: str) -> str:
    """Extract video ID from various YouTube URL formats."""
    import re
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    print(f"Error: could not extract video ID from: {url}", file=sys.stderr)
    sys.exit(1)


def get_transcript(url: str, lang: str = "en", fmt: str = "json"):
    video_id = extract_video_id(url)
    ytt = YouTubeTranscriptApi()
    try:
        result = ytt.fetch(video_id, languages=[lang])
    except Exception as e:
        print(f"Error fetching transcript: {e}", file=sys.stderr)
        sys.exit(1)

    if fmt == "json":
        print(json.dumps(result.to_raw_data(), ensure_ascii=False, indent=2))
    else:
        print("\n".join(s.text for s in result.snippets))


def main():
    parser = argparse.ArgumentParser(description="Fetch YouTube transcript.")
    parser.add_argument("url", help="YouTube video URL or ID")
    parser.add_argument("--lang", default="en", help="Language code (default: en)")
    parser.add_argument("--format", default="json", choices=["json", "text"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    get_transcript(args.url, args.lang, args.format)


if __name__ == "__main__":
    main()
