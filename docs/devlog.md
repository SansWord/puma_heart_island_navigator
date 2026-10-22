# Devlog

Learnings from building the 沈伯洋 HEART 政策島 導航器, newest first.

### Learning tags

| Tag | Meaning |
|-----|---------|
| `[note]` | Useful context, well-documented — good to have written down but you'd find it in the docs |
| `[insight]` | Non-obvious; meaningfully changes how you design or debug something |
| `[gotcha]` | A specific trap that bit you; high risk of biting you again — bookmark this |

## TL;DR

| Version | Summary |
|---------|---------|
| [v1.4.1](#v141--local-preview-script-2026-10-22-0417) | `scripts/serve.sh` serves the site locally and opens the browser |
| [v1.4.0](#v140--labeled-wrapping-filters-2026-10-22-0415) | Filter groups labeled HEART 面向 / 政策主題; pills wrap and show each HEART word; mobile-friendly controls |
| [v1.3.1](#v131--descriptive-wording-everywhere-2026-10-22-0409) | Section subtitles, identifiers, README and devlog reworded to describe policies by what they are |
| [v1.3.0](#v130--wording-pass-2026-10-22-0407) | Card links read 拜訪政策島 / 拜訪網站政策專區; new 施政方向 section name |
| [v1.2.0](#v120--social-share-preview-2026-10-22-0404) | Open Graph / Twitter card tags with a 1200×630 preview image; 細節 expanded by default |
| [v1.1.0](#v110--puma-brand-theme-and-favicon-2026-10-22-0402) | Light-only theme from puma.taipei's brand tokens, orange header band, Noto Sans TC, official favicon |
| [v1.0.1](#v101--build-time-data-fetch-2026-10-22-0400) | Pages now deploys through GitHub Actions and downloads the official JSON at build time; no more data commits |
| [v1.0.0](#v100--initial-release-2026-10-22-0356) | Static per-year view of the 94 HEART policies, daily data sync via GitHub Actions, published on GitHub Pages |

## v1.4.1 — Local preview script (2026-10-22 04:17)

**Review:** not yet

**What was built:**
- `scripts/serve.sh [port]` serves the repo at `http://127.0.0.1:8765/` (or the given port), bound to localhost only, and opens the browser. It exits with a hint if the port is already in use.
- README explains why `index.html` needs a server.

**Key technical learnings:**
- `[note]` Opening `index.html` from disk (`file://`) can't work as built: Chrome blocks both `<script type="module">` and `fetch()` of local files. Supporting `file://` would mean a classic script plus the data shipped as a generated `policies.js` global. Decided to keep `fetch` + modules and use a local server.

## v1.4.0 — Labeled, wrapping filters (2026-10-22 04:15)

**Review:** not yet

**What was built:**
- Filter groups are labeled 「HEART 面向」 and 「政策主題」 (the official site's term for an island), as `role="group"` with `aria-labelledby`.
- HEART pills show the letter's meaning from puma.taipei/heart: H 空間, E 機會, A 陪伴, R 韌性, T 時間.
- Pills wrap onto more rows instead of scrolling sideways. At 540px and below, labels sit above their pills and pill spacing is tighter, so all six HEART pills fit on one row at 390px.
- The filter bar is sticky only at 720px and wider; on phones the wrapped pills would take up too much of the screen.

**Key technical learnings:**
- `[gotcha]` A media-query override placed before the base rule loses to it (same specificity, later rule wins). Put responsive overrides after the rules they change.
- `[gotcha]` `--window-size=390,…` in headless Chrome doesn't give a 390px viewport, because windows have a minimum width of about 500px. To check phone layout, render the page in a 390px-wide `<iframe>` and screenshot that.

## v1.3.1 — Descriptive wording everywhere (2026-10-22 04:09)

**Review:** not yet

**What was built:**
- Section subtitles now describe each period: 近程推動 / 中程推動 / 長程推動, 分階段推動, 任期第 5–8 年（第二任）, 施政方向 · 貫穿任期的方向與政策, and 其他時程.
- The header line is now 主題數 · 政策數 · 核對日 · 更新日, without the count of policies that have stage codes.
- All sections share one heading style; the `vague` flag and its grey style are gone. Identifiers renamed: bucket `none` → `direction` (anchor `#direction`), `.none` → `.no-match`.
- README, HTML comments and earlier devlog entries reworded as neutral facts.

**Key technical learnings:**
- `[insight]` In a public repo about someone's policies, identifiers, comments and devlog notes are published too. Describe the data by what it is (`direction`, 分階段推動) so nothing reads as a verdict on the policies.

## v1.3.0 — Wording pass (2026-10-22 04:07)

**Review:** not yet

**What was built:**
- Card links renamed: 在地圖上看 → 拜訪政策島, and the official policy link → 拜訪網站政策專區 - <title>. The prefix is added only when the link points to `https://puma.taipei/`; the 客家 island's news-article sources (自由時報, 壹蘋) keep their plain title.
- The section for policies without a stage code is now 施政方向 (貫穿任期的方向與政策).

**Key technical learnings:**
- `[insight]` Name a section after what its items are. 施政方向 fits every policy in it, from value-level commitments to ongoing programs such as 運動驛站 and 河濱車道評分. 核心價值 was considered but fits only the first kind.
- `[gotcha]` Policy sources include news coverage as well as puma.taipei pages, so a label that says 網站政策專區 checks the URL first.

## v1.2.0 — Social share preview (2026-10-22 04:04)

**Review:** not yet

**What was built:**
- Open Graph and Twitter card meta tags (`og:title`, `og:description`, `og:url`, `og:image` plus its size and alt text, `twitter:card=summary_large_image`) and a canonical link, so links shared on Threads, Facebook, LINE and X show a preview card.
- `assets/og.png` (1200×630) rendered from `scripts/og-card.html` by `scripts/og.sh` with headless Chrome. `scripts/` is excluded from the deployed site.
- Each policy's 細節 `<details>` is open by default.

**Key technical learnings:**
- `[gotcha]` `og:image` has to be an absolute URL; crawlers don't resolve relative paths. Threads and Facebook also cache previews per URL, so after changing the image, re-scrape it with Meta's Sharing Debugger (developers.facebook.com/tools/debug).
- `[insight]` Rendering the card from an HTML file with `--headless=new --window-size=1200,630 --virtual-time-budget=5000` gives a reproducible PNG with the real web font. The time budget lets Google Fonts load before the screenshot, and `display=block` prevents a fallback-font flash from being captured.
- `[note]` The card shows no policy counts on purpose, since the data changes daily and a baked-in image would go stale.

## v1.1.0 — Puma brand theme and favicon (2026-10-22 04:02)

**Review:** not yet

**What was built:**
- Light-only theme built from puma.taipei's `--brand-*` CSS tokens (surface `#fff8f4`, primary `#db6a41`, action `#ad4d2a`, border `#efc5ad`, yellow `#fcea8b`). Dark mode removed.
- Solid orange header band with a white 900-weight title, orange counts and bars in the summary, an orange rule under each year heading, and cards with a 4px orange top edge (borrowed from puma.taipei's `--home-hero-video-edge`).
- Noto Sans TC from Google Fonts, the official site's font. `theme-color` set to the brand orange.
- The official `puma.taipei/favicon.ico` copied to `assets/favicon.ico`.

**Key technical learnings:**
- `[insight]` puma.taipei exposes its whole palette as `--brand-*` custom properties in its built CSS (`/build/assets/puma-*.css`), so grepping those is faster and more exact than sampling colors from screenshots.
- `[gotcha]` White text on brand orange `#db6a41` is only about 3.3:1, which passes AA for large text only. Small text and pressed buttons use `--brand-action` `#ad4d2a` instead, as the official site does. The header lede is ink on orange.
- `[note]` puma.taipei publishes only a 32×32/16×16 `favicon.ico`: no SVG icon, apple-touch-icon or web manifest.

## v1.0.1 — Build-time data fetch (2026-10-22 04:00)

**Review:** not yet

**What was built:**
- Replaced `sync.yml` (daily commit of changed data) with `pages.yml`, which deploys Pages through GitHub Actions on push to `main`, daily at 04:17 Taipei, and on manual trigger. The deploy downloads `policies.json` into the build output and falls back to the committed snapshot if the download or validation fails.
- Pages source switched to GitHub Actions (`build_type=workflow`). `docs/` and `README.md` are dropped from the deployed site.

**Key technical learnings:**
- `[note]` GitHub's Actions servers can reach `puma.taipei` (verified with one manual run of the old sync workflow on 2026-10-22; data was unchanged).
- `[insight]` Downloading at build time keeps the repo history free of bot commits, but it also drops the record of when promises changed. The deploy-history diff idea from v1.0.0 would now need its own storage.
- `[gotcha]` `git rm` of the only file in `.github/workflows/` deletes the directory too, so a heredoc writing a new workflow file right after it fails until you `mkdir -p` again.

## v1.0.0 — Initial release (2026-10-22 03:56)

**Review:** not yet

**What was built:**
- Static page (`index.html`, `assets/app.js`, `assets/style.css`, no build step, `lang="zh-Hant-TW"`) that lists every policy by term year: 2027, 2028, 2029, 2030, 2031–2034, plus 短期／中期／長期, 第一–三階段 and a section for policies without a stage code.
- HEART-letter, island and keyword filters stored in the query string (`?heart=H&island=transport,sport&q=…`); `#y2028`-style hashes jump to a section.
- Each card shows that year's step, a calendar hint, the full official timeline, target group, details, a 在地圖上看 ↗ deep link and the official policy text link.
- `data/policies.json` snapshot (schemaVersion 3.0, 14 islands, 94 policies) and `.github/workflows/sync.yml`, a daily job that commits only when the official file changes.

**Key technical learnings:**
- `[insight]` All official data lives in `https://puma.taipei/heart-island-assets/policies.json`. Policies are `islands[].buildings[]`, and the schedule is `building.phase = { label: {zh,en}, stages: [codes], basis }`.
- `[gotcha]` That JSON is served without a CORS header (it's meant for puma.taipei's own pages), so another site has to serve its own copy. A committed snapshot refreshed by a scheduled Action does that.
- `[insight]` `https://puma.taipei/heart-island?focus=<islandId>` zooms to an island and opens its card. Other params: `lang=en`, `clock=stop`, `ratio=9x16`, `quality`, `debug`. Selecting a single policy happens through the sidebar (`#sidebar [data-id="<policyId>"]` → `selectBuilding(id)`). A possible upstream addition: let `?focus=` also accept building ids.
- `[note]` The official page has a term-timeline panel (就任 / 6 個月 / 第 1–2 年 / 第 3–4 年 / 第 5–8 年), opened from the page UI. Its `STAGE_SEG` mapping covers the year-based codes; short/mid/long/stage*/ay117 are shown here in their own sections.
- `[note]` 46 of 94 policies carry stage codes; the other 48 are direction-level policies, including all of 親子同行卡, 家庭一站通, 城市外交, 客家 and 台北文化徑×山林徑. Stage codes seen: `m1-8, m8-18, year1, year1-2, year2-3, year3-4, year5-8, ay117, short, mid, long, stage1–3`; the official JS also knows `m18-28` and `year4+`. Any new code lands in 其他時程.
- `[gotcha]` Data notes: the 台北研究院 island `url` links to the 城市外交 page, the 客家 island cites news coverage (news.ltn.com.tw), `en` fields are mostly empty, and `meta.stage` is `layout_and_data_awaiting_confirmation`, so the data may still be updated.
- `[insight]` Year mapping assumes the term starts 2026-12-25, so term year N ≈ 2026+N; years 5–8 group as 2031–2034. A policy spanning several stages appears in each year, and its label is split on `；` (falling back to `、`) only when the part count matches the stage count, so each year shows just its own step. Period- and stage-based codes get their own sections and keep the official wording.
- `[gotcha]` During local preview the browser caches `assets/app.js` aggressively; hard-reload after edits.

**Ideas not built yet:** a by-island view, CSV/JSON export of the flattened data, an English toggle (once the source data has English text), and a diff view of promise changes from the sync commit history.
