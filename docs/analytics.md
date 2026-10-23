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
| 複製並分享 click | event `copy-share/<id>` | Does anyone use the copy button, and for which policies |
| 拜訪政策島 click | event `visit/<id>` | How many readers go on to the official island, and from which policy |
| 找找 Puma click | event `puma/header` or `puma/footer` | Whether the header button or the footer link sends more people to the island |

Page views and events appear in separate lists on the dashboard. GoatCounter also reports referrers, browser, screen size and country for page views.

## How it works

- **Main page only.** The share pages (`p/<id>/`) send visitors to the main page right away, before a counting script would load. Link-preview crawlers don't run JavaScript, so they're never counted either way.
- **Shared-link paths.** `count.js` takes the page path from `<link rel="canonical">`, which points at the site root and drops `?p=`. An inline script in `index.html` reads `?p=<id>` at load time, before `app.js` removes it from the address bar, and sets `window.goatcounter.path` so the visit is recorded at the share page's path.
- **Click events.**
  - Links with `data-count="<name>"` are counted by one click listener in `assets/app.js`. The 找找 Puma links have the attribute in `index.html`; each card's 拜訪政策島 link gets it when the card is rendered.
  - The 複製並分享 handler calls `count()` directly.
  - `count.js` sends events with `navigator.sendBeacon`, so links that open in a new tab are still counted.
- **Adding an event.** Put `data-count="<name>"` on a link or button. In a click handler, call `count("<name>")` instead.

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

- **Is 複製並分享 used?** Look for `copy-share/…` events. A copy followed by `/p/<id>/` page views for the same policy means the shared link was opened.
- **Are we sending people to the island?** Compare `visit/…` plus `puma/…` events with main page views.
- **Header or footer?** Compare `puma/header` with `puma/footer`.
- **Where do visitors come from?** Check referrers on page views. In-app browsers often send no referrer, and links clicked on Threads may show its link redirect (`l.threads.com`), so take these numbers loosely.
