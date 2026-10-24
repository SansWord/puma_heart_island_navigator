# 沈伯洋 HEART 政策島 導覽器

Unofficial, supporter-made static site that lays out the 94 policies of puma.taipei's HEART 政策島 by term timeline. Live at <https://sansword.github.io/puma_heart_island_navigator/>, deployed by GitHub Pages on every push to `main`. The README (in Traditional Chinese) covers structure, data sync, share links and local preview.

## Pushing: the pre-push check

`.githooks/pre-push` runs on every `git push` to `main` (which deploys). Enable it once per clone with `git config core.hooksPath .githooks`. It runs `python3 scripts/sync.py --check --no-stamp`:

- **No changes**: the push goes ahead. The deploy re-runs the check and stamps `checkedAt` into the published `data/sync.json` (the page's 最後檢查), so no extra commit is needed.
- **Changes**: the push is blocked and the changes are listed. Show them to the user and ask how to proceed:
  1. **Update**: `python3 scripts/sync.py` (downloads into `data/`), review `git diff data/`, `python3 scripts/share_pages.py --images` for changed previews, commit, then `git push`.
  2. **Push as is**: `git push --no-verify`. The committed data goes live, and the deploy won't update `checkedAt`.
- **Check failed** (download error): the push is blocked. Retry, or ask the user before using `--no-verify`.

Never use `--no-verify` without the user's go-ahead.

## Commands

| Command | Purpose |
|---|---|
| `scripts/serve.sh [port]` | Local preview at `http://127.0.0.1:8765/` (also writes `p/`) |
| `python3 scripts/sync.py --check` | Compare with the official data; writes only `checkedAt`, and only when nothing changed (`--no-stamp`: never writes) |
| `python3 scripts/sync.py` | Download the official data into `data/` |
| `python3 scripts/share_pages.py --images` | Re-render stale per-policy previews into `assets/share/` (rerun if a few fail) |
| `python3 scripts/share_pages.py --stale` | List previews that need rendering |
| `sh scripts/og.sh` | Re-render `assets/og.png` and stamp its hash into `index.html` |

## Conventions

- Page text is Taiwan Traditional Chinese (`zh-Hant-TW`). Follow puma.taipei's terms (HEART 政策願景, 政策主題, 細項).
- Colors: brand orange `--brand` `#db6a41` for fills and large text, `--accent` `#ad4d2a` for small text; HEART pillars `--heart-h` … `--heart-t` (H `#b00201`, E `#5d3188`, A `#0753a7`, R `#21586c`, T `#13744b`), as on puma.taipei. Topics have no colors; they're told apart by number (01–14).
- Preview images (`assets/share/`, `assets/og.png`) are committed for review; `p/` is generated at deploy and git-ignored. Changing the share card template makes all 94 previews stale.
- `media/` is git-ignored, for local screenshots and comparison images.

## Docs

- [`docs/devlog.md`](docs/devlog.md): per-version learnings, newest first; versions match git tags.
- [`docs/analytics.md`](docs/analytics.md): GoatCounter setup, what's counted, reading the numbers.
