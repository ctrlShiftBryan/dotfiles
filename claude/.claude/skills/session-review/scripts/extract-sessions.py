#!/usr/bin/env python3
"""Extract Claude Code session data for a given date, rate effectiveness, output JSON."""

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude"
HISTORY_FILE = CLAUDE_DIR / "history.jsonl"
PROJECTS_DIR = CLAUDE_DIR / "projects"
SCRIPT_DIR = Path(__file__).parent.parent / "references"
PROJECT_MAP_FILE = SCRIPT_DIR / "project-map.json"

# --- Rating thresholds ---
ENGAGEMENT_THRESHOLDS = [(5, 0.2), (15, 0.4), (30, 0.6), (50, 0.8)]
TOOL_THRESHOLDS = [(10, 0.2), (30, 0.4), (60, 0.6), (100, 0.8)]
COMMIT_THRESHOLDS = [(0, 0.0), (2, 0.4), (5, 0.6), (10, 0.8)]
COST_EFF_THRESHOLDS = [(1, 0.2), (3, 0.4), (6, 0.6), (10, 0.8)]
DURATION_THRESHOLDS = [(0.01, 0.2), (0.03, 0.4), (0.06, 0.6), (0.1, 0.8)]

STAR_LABELS = {1: "Minimal", 2: "Light", 3: "Moderate", 4: "High Impact", 5: "Deep Work"}


def score_dimension(value, thresholds):
    """Map a value to 0-1 score using threshold brackets."""
    for threshold, score in thresholds:
        if value <= threshold:
            return score
    return 1.0


def compute_rating(prompts, tool_uses, commits, cost, session_duration_ms, api_duration_ms):
    """Compute weighted composite rating, return (stars, label, raw_score)."""
    engagement = score_dimension(prompts, ENGAGEMENT_THRESHOLDS)
    tool_depth = score_dimension(tool_uses, TOOL_THRESHOLDS)

    # Commits: 0 is special case (score 0)
    if commits == 0:
        output_impact = 0.0
    else:
        output_impact = score_dimension(commits, COMMIT_THRESHOLDS)

    # Cost efficiency: prompts per dollar (higher = more efficient)
    cost_eff = prompts / cost if cost > 0 else 0
    cost_score = score_dimension(cost_eff, COST_EFF_THRESHOLDS)

    # Duration ratio: api_duration / session_duration (higher = more active)
    dur_ratio = api_duration_ms / session_duration_ms if session_duration_ms > 0 else 0
    dur_score = score_dimension(dur_ratio, DURATION_THRESHOLDS)

    raw = (
        0.25 * engagement
        + 0.20 * tool_depth
        + 0.25 * output_impact
        + 0.15 * cost_score
        + 0.15 * dur_score
    )

    if raw <= 0.2:
        stars = 1
    elif raw <= 0.4:
        stars = 2
    elif raw <= 0.6:
        stars = 3
    elif raw <= 0.8:
        stars = 4
    else:
        stars = 5

    return stars, STAR_LABELS[stars], round(raw, 3)


def load_project_map():
    """Load project-map.json for path -> display name mapping."""
    if PROJECT_MAP_FILE.exists():
        with open(PROJECT_MAP_FILE) as f:
            return json.load(f)
    return {}


def encode_project_path(path):
    """Convert a project path to Claude's encoded directory name."""
    return path.replace("/", "-")


def get_target_date_range(date_str):
    """Return (start_ms, end_ms) for the target date in local time."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    start = dt.timestamp() * 1000
    end = (dt + timedelta(days=1)).timestamp() * 1000
    return int(start), int(end)


def parse_history(date_str):
    """Parse history.jsonl, return entries for target date grouped by sessionId."""
    start_ms, end_ms = get_target_date_range(date_str)
    sessions = defaultdict(list)

    if not HISTORY_FILE.exists():
        return sessions

    with open(HISTORY_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            ts = entry.get("timestamp", 0)
            if start_ms <= ts < end_ms:
                sid = entry.get("sessionId")
                if sid:
                    sessions[sid].append(entry)

    return sessions


def find_session_files(project_path, session_id):
    """Find metrics.json and session.jsonl for a given session."""
    encoded = encode_project_path(project_path)
    proj_dir = PROJECTS_DIR / encoded

    metrics_file = proj_dir / f"{session_id}.metrics.json"
    session_file = proj_dir / f"{session_id}.jsonl"

    return (
        metrics_file if metrics_file.exists() else None,
        session_file if session_file.exists() else None,
    )


def parse_metrics(metrics_file):
    """Parse a metrics.json file."""
    if not metrics_file:
        return {}
    try:
        with open(metrics_file) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def parse_session_jsonl(session_file):
    """Stream-parse session.jsonl extracting key data."""
    result = {
        "user_message_count": 0,
        "first_prompt": "",
        "tool_counts": defaultdict(int),
        "git_commits": 0,
        "models": set(),
        "git_branch": "",
        "top_prompts": [],
    }

    if not session_file:
        return result

    try:
        with open(session_file) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                entry_type = entry.get("type", "")
                msg = entry.get("message", {})
                if not isinstance(msg, dict):
                    continue

                role = msg.get("role", "")
                content = msg.get("content", "")

                # Extract git branch from entry metadata
                branch = entry.get("gitBranch", "")
                if branch and not result["git_branch"]:
                    result["git_branch"] = branch

                # Extract model from assistant messages
                model = msg.get("model", "")
                if model:
                    result["models"].add(model)

                # Also check slug field for model info
                slug = entry.get("slug", "")
                if slug:
                    result["models"].add(slug)

                # Count user messages
                if role == "user":
                    if isinstance(content, str) and content.strip():
                        result["user_message_count"] += 1
                        # Capture first meaningful prompt
                        if not result["first_prompt"] and len(content.strip()) > 5:
                            cleaned = content.strip()
                            # Skip slash commands and context commands
                            if not cleaned.startswith("/"):
                                result["first_prompt"] = cleaned[:120]
                                result["top_prompts"].append(cleaned[:120])
                            elif len(result["top_prompts"]) < 5:
                                result["top_prompts"].append(cleaned[:120])
                    elif isinstance(content, list):
                        has_text = any(
                            c.get("type") == "text" and c.get("text", "").strip()
                            for c in content
                            if isinstance(c, dict)
                        )
                        has_tool_result = any(
                            c.get("type") == "tool_result" for c in content if isinstance(c, dict)
                        )
                        if has_text and not has_tool_result:
                            result["user_message_count"] += 1
                            for c in content:
                                if isinstance(c, dict) and c.get("type") == "text":
                                    text = c.get("text", "").strip()
                                    if text and not result["first_prompt"] and len(text) > 5:
                                        if not text.startswith("/"):
                                            result["first_prompt"] = text[:120]
                                    if text and len(result["top_prompts"]) < 5:
                                        result["top_prompts"].append(text[:120])
                                    break

                # Count tool uses from assistant messages
                if role == "assistant" and isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict) and c.get("type") == "tool_use":
                            tool_name = c.get("name", "unknown")
                            result["tool_counts"][tool_name] += 1

                # Detect git commits from tool results
                if isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict) and c.get("type") == "tool_result":
                            tool_content = c.get("content", "")
                            if isinstance(tool_content, str) and "git commit" in tool_content.lower():
                                # Count lines that look like successful commits
                                for result_line in tool_content.split("\n"):
                                    if re.search(
                                        r"\[[\w/\-]+\s+[0-9a-f]{7,}\]", result_line
                                    ):
                                        result["git_commits"] += 1
                elif isinstance(content, str) and "git commit" in content.lower():
                    for result_line in content.split("\n"):
                        if re.search(r"\[[\w/\-]+\s+[0-9a-f]{7,}\]", result_line):
                            result["git_commits"] += 1

                # Also check toolUseResult for git commits (progress entries)
                tool_result = entry.get("toolUseResult", "")
                if isinstance(tool_result, str) and tool_result:
                    for result_line in tool_result.split("\n"):
                        if re.search(r"\[[\w/\-]+\s+[0-9a-f]{7,}\]", result_line):
                            result["git_commits"] += 1

    except OSError:
        pass

    result["models"] = list(result["models"])
    result["tool_counts"] = dict(result["tool_counts"])
    return result


def normalize_project_path(path):
    """Normalize worktree paths to parent repo. Return (parent_path, is_worktree, branch_from_path)."""
    # Match worktree pattern: /repo-worktrees/branch-name
    wt_match = re.match(r"(.+?)-worktrees/(.+)$", path)
    if wt_match:
        return wt_match.group(1), True, wt_match.group(2)
    return path, False, ""


def get_display_name(path, project_map):
    """Get human-readable project name from path."""
    # Check project map first
    if path in project_map:
        return project_map[path].get("display_name", os.path.basename(path))

    # Fall back to basename
    name = os.path.basename(path)
    # Clean up common patterns
    name = name.replace("-", " ").title()
    return name


def classify_project(path):
    """Classify project as production or prototyping based on path."""
    if "/code2/" in path:
        return "prototyping"
    if "/code/" in path or "/code5/" in path:
        return "production"
    return "other"


def is_trivial_session(session_data, metrics):
    """Check if session should be filtered out."""
    user_msgs = session_data.get("user_message_count", 0)
    total_tools = sum(session_data.get("tool_counts", {}).values())
    models = session_data.get("models", [])

    # Filter: haiku-only sessions (turbocommit/utility)
    if models and all("haiku" in m.lower() for m in models):
        return True, "haiku"

    # Filter: minimal engagement
    if user_msgs <= 1 and total_tools == 0:
        return True, "trivial"

    return False, ""


def main():
    parser = argparse.ArgumentParser(description="Extract Claude Code session data")
    parser.add_argument(
        "--date",
        default=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        help="Date to extract (YYYY-MM-DD, default: yesterday)",
    )
    args = parser.parse_args()
    date_str = args.date

    project_map = load_project_map()
    history_sessions = parse_history(date_str)

    if not history_sessions:
        print(
            json.dumps(
                {
                    "date": date_str,
                    "summary": {
                        "total_sessions": 0,
                        "filtered_sessions": 0,
                        "total_cost": 0,
                        "total_prompts": 0,
                    },
                    "projects": [],
                    "filtered_detail": {"haiku": 0, "trivial": 0},
                },
                indent=2,
            )
        )
        return

    # Group sessions by normalized project
    project_sessions = defaultdict(list)
    filter_counts = {"haiku": 0, "trivial": 0}
    total_filtered = 0

    for session_id, entries in history_sessions.items():
        if not entries:
            continue

        project_path = entries[0].get("project", "")
        if not project_path:
            continue

        parent_path, is_worktree, wt_branch = normalize_project_path(project_path)

        # Find and parse session files
        metrics_file, session_file = find_session_files(project_path, session_id)
        metrics = parse_metrics(metrics_file)
        session_data = parse_session_jsonl(session_file)

        # Check if trivial
        is_triv, reason = is_trivial_session(session_data, metrics)
        if is_triv:
            filter_counts[reason] = filter_counts.get(reason, 0) + 1
            total_filtered += 1
            continue

        # Build session info
        cost = metrics.get("cost_usd", 0)
        duration_ms = metrics.get("session_duration_ms", 0)
        api_duration_ms = metrics.get("api_duration_ms", 0)
        tokens = metrics.get("tokens", {})
        total_tokens = sum(tokens.values()) if isinstance(tokens, dict) else 0

        branch = session_data.get("git_branch", "") or wt_branch

        session_info = {
            "session_id": session_id,
            "project_path": project_path,
            "prompts": len(entries),
            "user_messages": session_data["user_message_count"],
            "cost": round(cost, 2),
            "duration_ms": duration_ms,
            "api_duration_ms": api_duration_ms,
            "total_tokens": total_tokens,
            "git_commits": session_data["git_commits"],
            "tool_counts": session_data["tool_counts"],
            "total_tool_uses": sum(session_data["tool_counts"].values()),
            "models": session_data["models"],
            "branch": branch,
            "first_prompt": session_data["first_prompt"],
            "top_prompts": session_data["top_prompts"],
        }

        project_sessions[parent_path].append(session_info)

    # Build project summaries
    projects = []
    total_cost = 0
    total_prompts = 0
    total_tokens_all = 0
    total_duration_ms = 0

    for proj_path, sessions in sorted(project_sessions.items(), key=lambda x: -sum(s["cost"] for s in x[1])):
        proj_prompts = sum(s["prompts"] for s in sessions)
        proj_cost = sum(s["cost"] for s in sessions)
        proj_tokens = sum(s["total_tokens"] for s in sessions)
        proj_duration = sum(s["duration_ms"] for s in sessions)
        proj_api_duration = sum(s["api_duration_ms"] for s in sessions)
        proj_commits = sum(s["git_commits"] for s in sessions)
        proj_tool_uses = sum(s["total_tool_uses"] for s in sessions)
        proj_branches = list(set(s["branch"] for s in sessions if s["branch"]))

        # Collect unique top prompts
        all_prompts = []
        for s in sessions:
            if s["first_prompt"]:
                all_prompts.append(s["first_prompt"])

        # Rating
        stars, label, raw_score = compute_rating(
            proj_prompts, proj_tool_uses, proj_commits, proj_cost, proj_duration, proj_api_duration
        )

        display = get_display_name(proj_path, project_map)
        classification = classify_project(proj_path)

        # Check if this is an unmapped project
        is_mapped = proj_path in project_map

        proj_entry = {
            "path": proj_path,
            "name": os.path.basename(proj_path),
            "display_name": display,
            "classification": classification,
            "is_mapped": is_mapped,
            "sessions": len(sessions),
            "prompts": proj_prompts,
            "total_tokens": proj_tokens,
            "cost": round(proj_cost, 2),
            "duration_hours": round(proj_duration / 3600000, 1),
            "api_duration_hours": round(proj_api_duration / 3600000, 2),
            "git_commits": proj_commits,
            "tool_uses": proj_tool_uses,
            "rating": stars,
            "rating_label": label,
            "rating_raw": raw_score,
            "branches": proj_branches,
            "top_prompts": all_prompts[:5],
        }

        projects.append(proj_entry)
        total_cost += proj_cost
        total_prompts += proj_prompts
        total_tokens_all += proj_tokens
        total_duration_ms += proj_duration

    total_sessions = sum(len(s) for s in project_sessions.values())

    output = {
        "date": date_str,
        "summary": {
            "total_sessions": total_sessions + total_filtered,
            "active_sessions": total_sessions,
            "filtered_sessions": total_filtered,
            "total_cost": round(total_cost, 2),
            "total_prompts": total_prompts,
            "total_tokens": total_tokens_all,
            "duration_hours": round(total_duration_ms / 3600000, 1),
        },
        "projects": projects,
        "filtered_detail": filter_counts,
        "unmapped_projects": [p["path"] for p in projects if not p["is_mapped"]],
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
