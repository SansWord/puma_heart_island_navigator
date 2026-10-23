# Analytics (GoatCounter)

How the site counts visits and clicks, how to read the numbers, and how to keep your own visits out of them.

- Dashboard: <https://puma-heart-island-nav.goatcounter.com/>
- Code: the two `<script>` tags in `index.html` `<head>`, the `count()` helper in `assets/app.js`, and `data-count` attributes on links.
- Shipped in commit `014ebf9`.

## Why GoatCounter

- No cookies and no personal data, so no consent banner, which matters on a page about a political campaign.
- Free for non-commercial use, with one small script.
- This site has its own GoatCounter site (`puma-heart-island-nav`), separate from `sansword.goatcounter.com`, so its numbers don't mix with the other site's.

## What is counted

| What | Recorded as | Answers |
|---|---|---|
| Main page visit | `/puma_heart_island_navigator/` | How many people look at the timeline |
| Visit from a shared link (`?p=<id>`) | `/puma_heart_island_navigator/p/<id>/` | Which policies' shared links get opened |
| 複製並分享 click | events `copy-share/<id>` and `copy-share` | Does anyone use the copy button, and for which policies |
| 拜訪政策島 click | events `visit/<id>` and `visit` | How many readers go on to the official island, and from which policy |
| 找找 Puma click | event `puma/header` or `puma/footer` | Whether the header button or the footer link sends more people to the island |

Policy clicks are sent twice, with and without the id: the id-less `copy-share` and `visit` are site-wide totals, readable in one counter lookup (see [Showing the numbers on the page](#showing-the-numbers-on-the-page)). They shipped a few hours after the per-policy events (both on 2026-10-23), so clicks from those first hours only exist per policy.

Page views and events appear in separate lists on the dashboard. GoatCounter also reports referrers, browser, screen size and country for page views.

## How it works

- **Main page only.** The share pages (`p/<id>/`) send visitors to the main page right away, before a counting script would load. Link-preview crawlers don't run JavaScript, so they're never counted either way.
- **Shared-link paths.** `count.js` takes the page path from `<link rel="canonical">`, which points at the site root and drops `?p=`. An inline script in `index.html` reads `?p=<id>` at load time, before `app.js` removes it from the address bar, and sets `window.goatcounter.path` so the visit is recorded at the share page's path.
- **Click events.**
  - Links with `data-count="<name>"` are counted by one click listener in `assets/app.js`. The 找找 Puma links have the attribute in `index.html`.
  - Each card's 拜訪政策島 link also has `data-policy="<id>"`, which makes the listener call `countPolicy()`: `visit/<id>` and `visit`.
  - The 複製並分享 handler calls `countPolicy("copy-share", id)` directly.
  - `count.js` sends events with `navigator.sendBeacon`, so links that open in a new tab are still counted.
- **Adding an event.** Put `data-count="<name>"` on a link or button, plus `data-policy="<id>"` for a per-policy event. In a click handler, call `count("<name>")` or `countPolicy("<name>", id)` instead.

## Not counted

- **Local runs** (`localhost`, `127.0.0.1`, private network addresses, `file:`): `count.js` skips them on its own, so `scripts/serve.sh` testing never reaches the dashboard.
- **Headless browsers and known bots**: GoatCounter flags and drops them.
- **Visitors with ad blockers**: many block `gc.zgo.at`, so desktop numbers run low. Phones inside the Threads and LINE in-app browsers are mostly unaffected, and that's where most of this site's visitors come from.
- **The old 分享 menu** (`?menu=1`): its Threads, LINE and Facebook links aren't counted. Add `data-count` to them if the menu comes back.

## Excluding your own visits

With low traffic, your own checks can easily outnumber real visitors. GoatCounter has a built-in switch for this.

1. Open <https://sansword.github.io/puma_heart_island_navigator/#toggle-goatcounter>.
2. An alert says counting is now DISABLED in this browser.
3. Opening the same link again turns counting back on.

The switch is a `localStorage` flag (`skipgc`), so it applies to one browser on one device. While it's on, `count.js` sends nothing from that browser, page views or clicks. Turn it on in every browser you use:

- **Laptop:** each browser you use (Chrome, Safari…). Private windows start without the flag.
- **Phone:** Safari and Chrome separately.
- **In-app browsers:** the Threads, LINE and Facebook in-app browsers each keep their own storage, separate from Safari and from each other. To set the flag in one, open the `#toggle-goatcounter` link from inside that app. For LINE, send the link to yourself (for example in Keep memo) and tap it there. For Threads, tap it from somewhere inside the app, such as a message to yourself; this hasn't been tried yet.
- **Safari may forget it.** Safari can clear a site's storage after about seven days without a visit. If you haven't opened the site in a while, open the toggle link again; the alert says which state you're in.
- **Clearing site data** removes the flag as well.

To check a browser without changing anything, run `localStorage.getItem("skipgc")` in its console: `"t"` means your visits are skipped.

### Why not count your visits under a separate name?

A separate prefix (say `/me/...`) is possible: `count.js`'s path callback can rename page views, and `count()` in `app.js` can prefix events. Your visits would still add to the totals, visitor counts and referrer lists, so the numbers you care about would stay noisy. Skipping them entirely keeps the dashboard to real visitors. To test that counting itself works, use the browser's network panel: a request to `puma-heart-island-nav.goatcounter.com/count` with the path in `p=`.

## Reading the numbers

- **Is 複製並分享 used?** `copy-share` is the total; `copy-share/…` events show which policies. A copy followed by `/p/<id>/` page views for the same policy means the shared link was opened.
- **Are we sending people to the island?** Compare `visit` plus `puma/…` events with main page views.
- **Header or footer?** Compare `puma/header` with `puma/footer`.
- **Where do visitors come from?** Check referrers on page views. In-app browsers often send no referrer, and links clicked on Threads may show its link redirect (`l.threads.com`), so take these numbers loosely.

## Ideas not built yet

### Showing the numbers on the page

The idea: counts on the main page, per policy on each card and site-wide in the header. They'd be hidden by default and shown only in browsers with a `localStorage` flag, set from the dev console. That way you can look at them before deciding whether to make them public. Parked on 2026-10-23; the dashboard is enough for now.

- **Source.** GoatCounter's public counter, `https://puma-heart-island-nav.goatcounter.com/counter/<path>.json` (path URL-encoded). It needs **"allow using the visitor counter"** turned on in the site settings; until then it answers 403.
- **One path per request.** The counter can't return several paths at once.
  - Per-card numbers: 94 policies × 3 (`/p/<id>/`, `copy-share/<id>`, `visit/<id>`) = 282 requests.
  - Header numbers: 3 more (main page, `puma/header`, `puma/footer`).
  - That's about 290 per page load: fine while only you see them, too heavy once every visitor does.
- **Header numbers only: 3–6 requests.**
  - Main page views.
  - `TOTAL`, the special path for the whole site's page views. Main page and shared links are the only page views here, so shared-link visits = `TOTAL` − main page views.
  - 找找 Puma clicks, header and footer.
  - Site-wide 複製並分享 and 拜訪政策島 totals: the id-less `copy-share` and `visit` events, counted since 2026-10-23.
- **Check first, once the setting is on:**
  - Does `TOTAL` include click events? If it does, the subtraction is wrong; instead, send a `shared` event on each shared-link arrival and count that.
  - Are counts returned as display text (`"1,234"`)? Then the commas need stripping before doing math.
- **Middle ground for per-card numbers.** Fetch each card's numbers when it scrolls into view and cache them for the browser session: about 10–20 requests at a time.
- **Alternative.** A local script with a GoatCounter API token writes `data/stats.json`, reviewed and committed like `scripts/sync.py`. One request per visit, but the numbers are only as fresh as the last run.
- **Privacy.** Hiding numbers on the page doesn't make them private. With the counter setting on, anyone can query any path. A committed `stats.json` is public too.
