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
| [v1.6.1](#v161--threads-screenshots-2026-10-22-0449) | Shorter 階段 subtitle; phone screenshots for sharing on Threads |
| [v1.6.0](#v160--two-timeline-metrics-2026-10-22-0445) | Timeline regrouped: 任期期程 短期／中期／長期 (years absorbed) · 分階段推動 第一–三階段 · 施政方向 |
| [v1.5.5](#v155--feedback-invitation-2026-10-22-0438) | Footer invites feedback through GitHub issues or a Threads DM |
| [v1.5.4](#v154--official-terminology-2026-10-22-0437) | Labels follow puma.taipei: HEART 政策願景, 政策主題 / 細項, 看政見頁 |
| [v1.5.3](#v153--pinned-search-and-topic-reset-2026-10-22-0432) | Search bar pinned on phones too, typing jumps to results; picking a HEART direction drops topics outside it |
| [v1.5.2](#v152--footer-credit-2026-10-22-0428) | Low-key footer line: 由 SansWord 製作 · GitHub 原始碼 |
| [v1.5.1](#v151--back-to-top-button-2026-10-22-0426) | Floating 回到頂端 button once the header scrolls away |
| [v1.5.0](#v150--heart-aware-topic-pills-2026-10-22-0424) | Selecting a HEART direction greys out topics that don't share it |
| [v1.4.2](#v142--policy-picking-guidance-2026-10-22-0423) | Header and link tooltips tell readers to pick the policy from the island's 政策細項 list |
| [v1.4.1](#v141--local-preview-script-2026-10-22-0417) | `scripts/serve.sh` serves the site locally and opens the browser |
| [v1.4.0](#v140--labeled-wrapping-filters-2026-10-22-0415) | Filter groups labeled HEART 面向 / 政策主題; pills wrap and show each HEART word; mobile-friendly controls |
| [v1.3.1](#v131--descriptive-wording-everywhere-2026-10-22-0409) | Section subtitles, identifiers, README and devlog reworded to describe policies by what they are |
| [v1.3.0](#v130--wording-pass-2026-10-22-0407) | Card links read 拜訪政策島 / 拜訪網站政策專區; new 施政方向 section name |
| [v1.2.0](#v120--social-share-preview-2026-10-22-0404) | Open Graph / Twitter card tags with a 1200×630 preview image; 細節 expanded by default |
| [v1.1.0](#v110--puma-brand-theme-and-favicon-2026-10-22-0402) | Light-only theme from puma.taipei's brand tokens, orange header band, Noto Sans TC, official favicon |
| [v1.0.1](#v101--build-time-data-fetch-2026-10-22-0400) | Pages now deploys through GitHub Actions and downloads the official JSON at build time; no more data commits |
| [v1.0.0](#v100--initial-release-2026-10-22-0356) | Static per-year view of the 94 HEART policies, daily data sync via GitHub Actions, published on GitHub Pages |

## v1.6.1 — Threads screenshots (2026-10-22 04:49)

**Review:** not yet

**What was built:**
- 第一–三階段 section subtitle shortened to 「各主題內的推動順序」 so it fits on one line at phone width. The by-topic ordering is explained in the footer and README.
- Five 1080×1440 (3:4) phone screenshots for a Threads post: header, summary tiles, HEART filter greying out topics, a 第一階段 card, and a searched 中期 card. Not committed.

**Key technical learnings:**
- `[insight]` Sharp phone screenshots without a device emulator: serve a wrapper page from the **same origin** as the site (a folder with symlinks to `index.html`, `assets/`, `data/` plus `shot.html`). The wrapper holds a 390px iframe, scrolls it to a selector through `contentWindow`, and hides the floating button. Then run headless Chrome with `--force-device-scale-factor=2.7692 --window-size=500,520` and center-crop to 1080×1440 with `sips -c 1440 1080`. Same origin is what allows scripting the iframe; from `file://` it's blocked.

## v1.6.0 — Two timeline metrics (2026-10-22 04:45)

**Review:** not yet

**What was built:**
- Sections went from 13 (five year sections, 短期／中期／長期, 第一–三階段, 施政方向, 其他) to 7 in three labelled groups:
  - **任期期程**: 短期 (任期第 1–2 年), 中期 (第 3–4 年), 長期 (第 5 年起). Year codes and the official 短期／中期／長期 share this one scale. Codes that span the boundary (`m18-28`, `year2-3`, `ay117`, `year4+`) appear in both periods, each with its own step. Cards are sorted by start time (`at` in `STAGES`).
  - **分階段推動**: 第一／二／三階段 with counts. Cards inside a stage keep topic order, so each topic's rollout lines up across the three sections.
  - **貫穿任期**: 施政方向 (and 其他時程 if an unknown code ever appears).
- Summary row shows the three groups with labels. On wide screens they sit in one row with equal tile sizes; on phones each group is a row of three tiles.
- Old anchors `#y2027`–`#y2031` and `#none` redirect to their new section, on load and on in-page hash changes.
- Lede, meta and OG text now say 「依承諾的期程排開」. The OG image tiles read 短期 · 中期 · 長期 · 分階段 · 施政方向. The footer and README explain the period mapping and what a 階段 means.

**Key technical learnings:**
- `[insight]` The data uses two separate ways to describe timing, and no topic mixes them. Term years and 短期／中期／長期 are time; 第一–三階段 (都市微森林, 營養午餐, 青年政策) is rollout order within a topic. Merging stages into periods would invent dates, so they stay a separate metric.
- `[note]` Nothing in the data links one policy's stage to another policy. `flows` connect topics (every policy in a topic carries the same flow ids) and `phase` has only label, stages and basis. Cross-stage continuity exists only inside a single card (彈性餐費機制, AI 教育錢包).
- `[gotcha]` Changing only the `#hash` of the current URL is a same-document navigation: no reload, so code that reads `location.hash` at load never runs. Anchor aliases need a `hashchange` listener too.

## v1.5.5 — Feedback invitation (2026-10-22 04:38)

**Review:** not yet

**What was built:**
- New footer line below the credit: 「有想法或建議？歡迎在 GitHub 開 issue，或到 Threads 私訊我。」, linking to the repo's issues page and the Threads profile. Same grey `.credit` styling.

## v1.5.4 — Official terminology (2026-10-22 04:37)

**Review:** not yet

**What was built:**
- HEART filter label: 「HEART 面向」 → 「HEART 政策願景」.
- Header counts: 「14 個主題 · 94 項政策」 → 「14 項政策主題 · 94 個細項」, as on the island page.
- Policy-page link: 「拜訪網站政策專區 - 教育政策」 → 「看政見頁 - 教育政策」.

**Key technical learnings:**
- `[insight]` Terminology reference, checked against puma.taipei on 2026-10-22. Use the official term in the UI; news wording is context only.

  | Concept | puma.taipei | News coverage | This site |
  |---|---|---|---|
  | H/E/A/R/T as a set | 政策願景 (「五個政策願景」, nav item) | 五大主軸, HEART 五大政見 | HEART 政策願景 |
  | Letter names | H 空間, E 機會, A 陪伴, R 韌性, T 時間 | E sometimes 培力 / 創造機會 | as official |
  | An island | 政策主題 (「14 項政策主題」) | — | 政策主題 |
  | A policy item | 細項 (「94 個細項」), 政見 (「選一項政見」) | 政見 | 細項 in counts, 政見 in prose |
  | Island panel list | 政策細項 | — | 政策細項 |
  | `/policies/<name>` page | 政見頁 (「前往政見頁：…」) | — | 看政見頁 |
  | Timeline panel | 任期時間軸 | — | 任期第 N 年 |
  | Undated policies | (no official term) | — | 施政方向 |

## v1.5.3 — Pinned search and topic reset (2026-10-22 04:32)

**Review:** not yet

**What was built:**
- The search box moved out of the filter section into its own `.searchbar` (64px, `--search-h`), pinned at the top on every screen size. On 720px and wider, the filter pills stay pinned right below it (`top: var(--search-h)`); on phones only the search bar stays pinned.
- Typing in search while scrolled down jumps to where the results start (just below the orange header).
- Picking a HEART direction drops any selected topic that doesn't share it. If none remain, the topic filter returns to 全部, so the list shows that whole direction.

**Key technical learnings:**
- `[gotcha]` `position: sticky` only sticks within its parent. To pin the search box without the filters on phones, it needed its own wrapper next to `.controls`, not inside it.
- `[insight]` Two stacked sticky bars work as siblings: the first at `top: 0`, the second at `top: <first's height>`. A fixed height in a CSS variable keeps the offset and `scroll-margin-top` in sync.

## v1.5.2 — Footer credit (2026-10-22 04:28)

**Review:** not yet

**What was built:**
- The last footer line reads 「由 SansWord 製作 · GitHub 原始碼」. SansWord links to the Threads profile and GitHub 原始碼 to the repo. The links use the footer's grey and turn brand orange on hover, so the line stays quiet.
- Footer bottom padding raised to 88px so the floating back-to-top button never covers the last line.

**Key technical learnings:**
- `[note]` Credits and source links go in the footer, below the disclaimer: that's where people look for them, and it keeps the header about the content.

## v1.5.1 — Back-to-top button (2026-10-22 04:26)

**Review:** not yet

**What was built:**
- A round brand-orange 回到頂端 button fixed at the bottom right (48px tap target, respects iPhone safe-area insets). It fades in once the orange header leaves the viewport and fades out near the top.
- An `IntersectionObserver` on `.top-band` toggles it, so there's no scroll listener. While hidden, it's out of the tab order (`tabIndex=-1`, `aria-hidden`).
- Smooth scroll, or an instant jump under `prefers-reduced-motion`. Clicking also clears any `#section` hash from the URL.

**Key technical learnings:**
- `[gotcha]` Browser extensions and chat widgets also like the bottom-right corner. In local testing an extension's floating icon covered the button and swallowed clicks; `document.elementFromPoint` at the button's center shows what is actually on top.

## v1.5.0 — HEART-aware topic pills (2026-10-22 04:24)

**Review:** not yet

**What was built:**
- With any HEART direction selected, each 政策主題 pill stays active only if its island's `heart` letters include a selected one. The rest are greyed out (`disabled`, 35% opacity). A topic that's already selected stays clickable so it can be turned off.
- `chips()` takes an optional `available(value)` callback, which the island group uses.

**Key technical learnings:**
- `[note]` HEART letters belong to islands (`islands[].heart`), and policies inherit them, so topic availability and the policy filter agree. 台北研究院 and 客家 have no letters in the current data, so they're greyed out under any HEART filter.

## v1.4.2 — Policy-picking guidance (2026-10-22 04:23)

**Review:** not yet

**What was built:**
- The header now says that 拜訪政策島 opens the island, and the reader then picks the policy from the island panel's 「政策細項」 list.
- Each 拜訪政策島 link has a tooltip naming the island and the policy to pick, e.g. 開啟「交通政策」後，在「政策細項」點選「通學區」.
- A code comment at `mapUrl` in `assets/app.js` marks where to switch to a per-policy link.

**Key technical learnings:**
- `[note]` After `?focus=<islandId>`, the official page opens the island's panel on the left with a 「政策細項」 list (orange bullet, title, start year). Each policy there opens its own detail.
- `[insight]` Next step depends on puma.taipei: if `?focus=` (or a new parameter) accepts a policy id, change `mapUrl` to use `b.id` and drop the guidance text and tooltip.

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
