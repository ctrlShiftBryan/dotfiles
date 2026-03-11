#!/usr/bin/env python3
"""SessionStart hook: check if yesterday's session review is pending."""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

VAULTS_FILE = Path.home() / ".config" / "obsidian-ace" / "vaults.json"


def get_vault_path():
    """Get Staff Engineering vault path from registry."""
    if not VAULTS_FILE.exists():
        return None
    try:
        vaults = json.loads(VAULTS_FILE.read_text())
        for v in vaults:
            if "staff" in v.get("name", "").lower():
                return Path(v["path"])
    except (json.JSONDecodeError, KeyError):
        pass
    return None


def main():
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    vault = get_vault_path()

    if not vault:
        return

    daily_note = vault / "Calendar" / "Daily" / f"{yesterday}.md"

    if not daily_note.exists():
        print(f"Session review pending for {yesterday}. Run /session-review")
        sys.exit(0)

    content = daily_note.read_text()
    if "## Claude Sessions" not in content:
        print(f"Session review pending for {yesterday}. Run /session-review")
        sys.exit(0)

    # Already done — silent


if __name__ == "__main__":
    main()
