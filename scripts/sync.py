#!/usr/bin/env python3
"""Downloads the official policies.json into data/ and summarises what changed, for review.

Deploys publish only the committed data/, so a sync goes live when it's committed and pushed:

    python3 scripts/sync.py --check   # only look: summary and old → new values; data/ untouched,
                                      # except checkedAt when nothing changed; exits 10 if anything did
    python3 scripts/sync.py --check --no-stamp   # same, never writes (.githooks/pre-push)
    python3 scripts/sync.py           # download into data/ + the same summary
    git diff data/                    # full diff, if the summary needs a closer look
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
# --check exit status when the official data differs (1 is a failed download); .githooks/pre-push and
# the deploy read it.
CHANGED = 10
# Topic fields the page uses (name and number on cards and pills, heart for the HEART badges).
ISLAND_FIELDS = ["name", "number", "heart"]


def zh(v):
    return v if isinstance(v, str) else (v or {}).get("zh") or ""


def index(d):
    return {b["id"]: (i, b) for i in d["islands"] for b in i["buildings"]}


def show(v, limit=160):
    """One line for an old/new value: {zh, en} pairs read as their zh text."""
    def flat(x):
        if isinstance(x, dict):
            return x.get("zh") if x and set(x) <= {"zh", "en"} else {k: flat(y) for k, y in x.items()}
        return [flat(y) for y in x] if isinstance(x, list) else x
    v = flat(v)
    text = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    return text if len(text) <= limit else text[:limit] + "…"


def diff(label, old, new):
    print(f"      {label}")
    print(f"        舊 {show(old)}")
    print(f"        新 {show(new)}")


def stamp(**fields):
    """Updates data/sync.json, keeping its other fields. fetchedAt: last download into data/.
    checkedAt: last time data/ was confirmed to match the official data. The page shows both."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data = json.loads(SYNC.read_text()) if SYNC.exists() else {}
    data.update({k: now for k in fields})
    SYNC.write_text(json.dumps(data, separators=(",", ":")) + "\n")


def main():
    check = "--check" in sys.argv[1:]
    no_stamp = "--no-stamp" in sys.argv[1:]
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
    oi = {i["id"]: i for i in old["islands"]}
    islands = {i["id"]: [f for f in ISLAND_FIELDS if oi[i["id"]].get(f) != i.get(f)] for i in new["islands"] if i["id"] in oi}
    islands = {k: fs for k, fs in islands.items() if fs}
    # Anything else that differs, by top-level key (islands counted only when the policies above don't explain it).
    keys = [k for k in sorted(set(old) | set(new)) if old.get(k) != new.get(k)]
    other = [k for k in keys if k != "islands" or not (added or removed or changed or islands)]

    if not check:
        DATA.write_bytes(raw)  # byte-for-byte, so git diff shows only the official changes
        stamp(fetchedAt=True, checkedAt=True)
    elif old == new and not no_stamp:
        stamp(checkedAt=True)  # a check that finds nothing new still confirms the data is current

    print(f"官方資料核對日 {old['meta'].get('verifiedAt')} → {new['meta'].get('verifiedAt')}")
    print(f"政見 {len(a)} → {len(b)}")
    for k in added:
        print(f"  + {k}  {zh(b[k][1]['name'])}（{zh(b[k][0]['name'])}）")
    for k in removed:
        print(f"  - {k}  {zh(a[k][1]['name'])}  ← its share link will 404 (404.html sends people home)")
    for k, fs in changed.items():
        print(f"  ~ {k}  {zh(b[k][1]['name'])}: {', '.join(fs)}")
        for f in fs:
            diff(f, a[k][1].get(f), b[k][1].get(f))
    ni = {i["id"]: i for i in new["islands"]}
    for k, fs in islands.items():
        print(f"  ~ 主題 {k}  {zh(ni[k]['name'])}: {', '.join(fs)}")
        for f in fs:
            diff(f, oi[k].get(f), ni[k].get(f))
    if other:
        print(f"  Other fields differ: {', '.join(other)}" + ("" if check else " (see git diff data/)."))
    if old == new:
        print("  No changes." + (" checkedAt updated in data/sync.json." if check and not no_stamp else ""))
    elif check:
        print("Only checked; data/ unchanged. Run python3 scripts/sync.py to download.")
        sys.exit(CHANGED)


if __name__ == "__main__":
    main()
