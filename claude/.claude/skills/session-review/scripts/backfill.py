#!/usr/bin/env python3
"""One-time backfill: run extract-sessions.py for a date range and write vault files."""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
EXTRACT_SCRIPT = SCRIPT_DIR / "extract-sessions.py"
PROJECT_MAP_FILE = SCRIPT_DIR.parent / "references" / "project-map.json"
VAULT = Path.home() / "staff-engineering" / "obsidian"
DAILY_DIR = VAULT / "Calendar" / "Daily"
USAGE_FILE = VAULT / "Atlas" / "III - Claude Usage" / "A. Usage Tracking.md"


def load_project_map():
    with open(PROJECT_MAP_FILE) as f:
        return json.load(f)


def extract_date(date_str):
    """Run extract-sessions.py for a date, return parsed JSON or None."""
    result = subprocess.run(
        ["python3", str(EXTRACT_SCRIPT), "--date", date_str],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  ERROR extracting {date_str}: {result.stderr.strip()}")
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"  ERROR parsing JSON for {date_str}")
        return None


def format_tokens(tokens):
    """Format token count as Xk."""
    return f"{round(tokens / 1000)}k"


def format_stars(rating):
    return "\u2605" * rating


def get_atlas_link(project, project_map):
    """Return [[Note Name]] if mapped, else plain display_name."""
    path = project.get("path", "")
    if path in project_map and project_map[path].get("atlas_note"):
        note = project_map[path]["atlas_note"]
        # Extract just the filename without .md
        name = Path(note).stem
        return f"[[{name}]]"
    return project["display_name"]


def write_daily_note(date_str, data, project_map):
    """Write or update daily note with Claude Sessions section."""
    summary = data["summary"]
    projects = data["projects"]
    filtered = data["filtered_detail"]

    if summary["active_sessions"] == 0:
        return

    # Build table
    lines = ["## Claude Sessions", "",
             "| Project | Prompts | Tokens | Cost | Rating |",
             "|---------|---------|--------|------|--------|"]

    for p in projects:
        link = get_atlas_link(p, project_map)
        tokens = format_tokens(p["total_tokens"])
        cost = f"${p['cost']:.2f}"
        stars = format_stars(p["rating"])
        lines.append(f"| {link} | {p['prompts']} | {tokens} | {cost} | {stars} |")

    lines.append("")
    total_cost = f"${summary['total_cost']:.2f}"
    lines.append(f"**Total:** {total_cost} across {summary['active_sessions']} sessions ({summary['duration_hours']}h active)")

    haiku = filtered.get("haiku", 0)
    trivial = filtered.get("trivial", 0)
    total_filtered = summary["filtered_sessions"]
    if total_filtered > 0:
        lines.append(f"Filtered: {total_filtered} utility/trivial sessions ({haiku} turbocommit, {trivial} trivial)")

    section = "\n".join(lines) + "\n"

    # Write file
    daily_file = DAILY_DIR / f"{date_str}.md"
    DAILY_DIR.mkdir(parents=True, exist_ok=True)

    if daily_file.exists():
        content = daily_file.read_text()
        # Replace existing section
        pattern = r"## Claude Sessions\n.*?(?=\n## |\Z)"
        if "## Claude Sessions" in content:
            content = re.sub(pattern, section.rstrip(), content, flags=re.DOTALL)
        else:
            content = content.rstrip() + "\n\n" + section
    else:
        content = f"---\ntags: [active]\n---\n# {date_str}\n\n{section}"

    daily_file.write_text(content)


def write_atlas_session_log(date_str, project, project_map):
    """Append/replace session log entry in Atlas repo note."""
    path = project["path"]
    if path not in project_map:
        return
    atlas_note = project_map[path].get("atlas_note")
    if not atlas_note:
        return

    note_file = VAULT / atlas_note
    if not note_file.exists():
        return

    # Build entry
    branches = ", ".join(project["branches"]) if project["branches"] else "main"
    key_work = project["top_prompts"][0] if project["top_prompts"] else "Session work"
    # Truncate key_work
    if len(key_work) > 80:
        key_work = key_work[:77] + "..."
    stars = format_stars(project["rating"])

    entry_lines = [
        f"### {date_str}",
        f"- {project['sessions']} session{'s' if project['sessions'] != 1 else ''}, {project['prompts']} prompt{'s' if project['prompts'] != 1 else ''}, ${project['cost']:.2f}",
        f"- Branches: {branches}",
        f'- Key work: "{key_work}"',
        f"- Rating: {stars}",
    ]
    entry = "\n".join(entry_lines)

    content = note_file.read_text()

    # Check for existing date entry
    date_pattern = rf"### {re.escape(date_str)}\n.*?(?=\n### |\n## |\Z)"
    if f"### {date_str}" in content:
        content = re.sub(date_pattern, entry, content, flags=re.DOTALL)
    elif "## Session Log" in content:
        # Append under Session Log — find insertion point (after last ### or after ## Session Log)
        # Insert in chronological order
        content = content.rstrip() + "\n\n" + entry + "\n"
    else:
        content = content.rstrip() + "\n\n## Session Log\n\n" + entry + "\n"

    note_file.write_text(content)


def write_usage_tracking(date_str, data):
    """Append/replace daily row in usage tracking."""
    summary = data["summary"]
    if summary["active_sessions"] == 0:
        return

    projects = data["projects"]
    top_project = projects[0]["name"] if projects else "unknown"

    row = f"| [[{date_str}]] | {summary['active_sessions']} | {summary['total_prompts']} | ${summary['total_cost']:.2f} | {top_project} |"

    USAGE_FILE.parent.mkdir(parents=True, exist_ok=True)

    if USAGE_FILE.exists():
        content = USAGE_FILE.read_text()
        # Replace existing row for this date
        date_row_pattern = rf"\| \[\[{re.escape(date_str)}\]\] \|.*\|"
        if f"[[{date_str}]]" in content:
            content = re.sub(date_row_pattern, row, content)
        else:
            # Append row to Daily Log table
            content = content.rstrip() + "\n" + row + "\n"
    else:
        content = (
            "---\ntags: [active]\n---\n# Claude Usage Tracking\n\n"
            "## Weekly Summary\n\n"
            "| Week | Sessions | Prompts | Cost | Top Project |\n"
            "|------|----------|---------|------|-------------|\n\n"
            "## Daily Log\n\n"
            "| Date | Sessions | Prompts | Cost | Top Project |\n"
            "|------|----------|---------|------|-------------|\n"
            + row + "\n"
        )

    USAGE_FILE.write_text(content)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Backfill session review for date range")
    parser.add_argument("--start", default=None, help="Start date YYYY-MM-DD (default: 30 days ago)")
    parser.add_argument("--end", default=None, help="End date YYYY-MM-DD (default: yesterday)")
    parser.add_argument("--dry-run", action="store_true", help="Extract but don't write files")
    args = parser.parse_args()

    today = datetime.now()
    start = datetime.strptime(args.start, "%Y-%m-%d") if args.start else today - timedelta(days=30)
    end = datetime.strptime(args.end, "%Y-%m-%d") if args.end else today - timedelta(days=1)

    project_map = load_project_map()
    all_unmapped = set()
    days_processed = 0
    days_skipped = 0
    total_cost = 0

    print(f"Backfilling {start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}")
    print(f"Vault: {VAULT}")
    print()

    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        current += timedelta(days=1)

        data = extract_date(date_str)
        if not data or data["summary"].get("active_sessions", 0) == 0:
            print(f"  {date_str}: no active sessions, skipping")
            days_skipped += 1
            continue

        s = data["summary"]
        print(f"  {date_str}: {s['active_sessions']} sessions, {s['total_prompts']} prompts, ${s['total_cost']:.2f}")

        if args.dry_run:
            days_processed += 1
            total_cost += s["total_cost"]
            for p in data.get("unmapped_projects", []):
                all_unmapped.add(p)
            continue

        # Write daily note
        write_daily_note(date_str, data, project_map)

        # Write Atlas session logs
        for project in data["projects"]:
            write_atlas_session_log(date_str, project, project_map)

        # Write usage tracking row
        write_usage_tracking(date_str, data)

        # Collect unmapped
        for p in data.get("unmapped_projects", []):
            all_unmapped.add(p)

        days_processed += 1
        total_cost += s["total_cost"]

    print()
    print(f"Done: {days_processed} days processed, {days_skipped} skipped, ${total_cost:.2f} total cost")

    if all_unmapped:
        print(f"\nUnmapped projects ({len(all_unmapped)}):")
        for p in sorted(all_unmapped):
            print(f"  - {p}")


if __name__ == "__main__":
    main()
