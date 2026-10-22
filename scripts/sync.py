#!/usr/bin/env python3
"""Downloads the official policies.json into data/ and summarises what changed, for review.

Deploys publish only the committed data/, so a sync goes live when it's committed and pushed:

    python3 scripts/sync.py     # download + summary
    git diff data/              # full diff, if the summary needs a closer look
    git commit -am "Sync policies.json" && git push

Uses curl: puma.taipei answers Python's default client with 403.
"""
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

URL = "https://puma.taipei/heart-island-assets/policies.json"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data/policies.json"
SYNC = ROOT / "data/sync.json"
# Fields shown on the page; a change in any of them is listed per policy.
FIELDS = ["name", "plain", "who", "facts", "phase", "sources"]


def zh(v):
    return v if isinstance(v, str) else (v or {}).get("zh") or ""


def index(d):
    return {b["id"]: (i, b) for i in d["islands"] for b in i["buildings"]}


def main():
    try:
        raw = subprocess.run(["curl", "-fsSL", f"{URL}?t={int(time.time())}"],
                             check=True, capture_output=True, timeout=60).stdout
        new = json.loads(raw)
        assert new.get("islands"), "no islands in payload"
    except Exception as e:  # keep the committed data untouched
        sys.exit(f"sync: download failed, data/ unchanged ({e})")

    old = json.loads(DATA.read_text(encoding="utf-8"))
    a, b = index(old), index(new)
    added = [k for k in b if k not in a]
    removed = [k for k in a if k not in b]
    changed = {k: [f for f in FIELDS if a[k][1].get(f) != b[k][1].get(f)] for k in a if k in b}
    changed = {k: fs for k, fs in changed.items() if fs}
    other = old != new and not (added or removed or changed)

    DATA.write_bytes(raw)  # byte-for-byte, so git diff shows only the official changes
    SYNC.write_text(json.dumps({"fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}) + "\n")

    print(f"官方資料核對日 {old['meta'].get('verifiedAt')} → {new['meta'].get('verifiedAt')}")
    print(f"政見 {len(a)} → {len(b)}")
    for k in added:
        print(f"  + {k}  {zh(b[k][1]['name'])}（{zh(b[k][0]['name'])}）")
    for k in removed:
        print(f"  - {k}  {zh(a[k][1]['name'])}  ← its share link will 404 (404.html sends people home)")
    for k, fs in changed.items():
        print(f"  ~ {k}  {zh(b[k][1]['name'])}: {', '.join(fs)}")
    if other:
        print("  Policies unchanged; other fields differ (see git diff data/).")
    if old == new:
        print("  No changes.")


if __name__ == "__main__":
    main()
