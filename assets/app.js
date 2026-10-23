// Turns the HEART policy-island data into a timeline: term periods, staged rollouts, and direction-level policies.
// Data is downloaded at deploy time (daily) from https://puma.taipei/heart-island-assets/policies.json
// The official file is served for puma.taipei's own pages (no CORS header), so this page reads its own copy.

const MAP_URL = "https://puma.taipei/heart-island";
// Share targets, each building its preview card from the shared page's og: tags.
// Threads and LINE also take prefilled text (shareText). Facebook dropped prefilled text, so there
// the caption only comes from the share page's og:title.
// encodeURIComponent, not URLSearchParams: the latter writes spaces as "+", which the Threads app
// shows literally.
const query = (params) => Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
const SHARE_TARGETS = [
  { label: "Threads", href: (url, text) => `https://www.threads.com/intent/post?${query({ text, url })}` },
  { label: "LINE", href: (url, text) => `https://social-plugins.line.me/lineit/share?${query({ url, text })}` },
  { label: "Facebook", href: (url) => `https://www.facebook.com/sharer/sharer.php?${query({ u: url })}` },
];
// Facebook sharing is hidden while it's being debugged. Flip this to bring it back, or add ?fb=1
// to the page URL to show it for testing (read once on load; the URL is rewritten afterwards).
const FACEBOOK_SHARE = false;
if (!FACEBOOK_SHARE && !new URLSearchParams(location.search).has("fb")) {
  SHARE_TARGETS.splice(SHARE_TARGETS.findIndex((t) => t.label === "Facebook"), 1);
}
// Phones get one more item for the system share sheet (Messenger, IG, mail…).
const nativeShare = !!navigator.share && matchMedia("(pointer: coarse)").matches;
// The 分享 menu (Threads / LINE / Facebook links) is hidden: those links misbehave inside in-app
// browsers. Cards get a single 複製並分享 button that copies the share text and link instead.
// Flip this to bring the menu back, or add ?menu=1 to the page URL to test it.
const SHARE_MENU = false;
const showMenu = SHARE_MENU || new URLSearchParams(location.search).has("menu");

// navigator.clipboard is often missing or blocked in in-app browsers (Threads, LINE, Facebook);
// fall back to selecting a hidden textarea and execCommand("copy").
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.readOnly = true;
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

// Click counts on GoatCounter (loaded in index.html). Missing when count.js is blocked or hasn't
// loaded yet; it also skips localhost.
const count = (path) => window.goatcounter?.count?.({ path, event: true });
// Policy clicks go out twice: <name>/<id>, and <name> alone, so a site-wide total is one counter
// lookup instead of one per policy.
const countPolicy = (name, id) => {
  count(`${name}/${id}`);
  count(name);
};
// A shared-link arrival (?p=<id>) is a page view at its share page's path (set in index.html), plus
// an id-less `shared` event as the site-wide total. That one is sent on load, so it waits for the
// async count.js; clicks come later and don't need to. Read ?p= now, before writeState() drops it.
if (new URLSearchParams(location.search).has("p")) {
  if (window.goatcounter?.count) count("shared");
  else document.getElementById("goatcounter")?.addEventListener("load", () => count("shared"));
}
// Links marked data-count="<name>" (the 找找 Puma links), or data-count plus data-policy="<id>"
// (each card's 拜訪政策島).
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-count]");
  if (!el) return;
  if (el.dataset.policy) countPolicy(el.dataset.count, el.dataset.policy);
  else count(el.dataset.count);
});

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

// HEART 政策願景 letters as named on https://puma.taipei/heart.
const HEART = { H: "空間", E: "機會", A: "陪伴", R: "韌性", T: "時間" };

// Two ways the official data describes timing, kept as two metrics:
// - 任期期程: term years and the official 短期／中期／長期, on one scale.
//   Term assumed to start 2026-12-25, so term year N ≈ calendar year 2026 + N.
// - 分階段推動: 第一／二／三階段, a rollout order within one topic (no dates attached).
const GROUPS = [
  { id: "term", label: "任期期程" },
  { id: "staged", label: "分階段推動" },
  { id: "whole", label: "貫穿任期" },
];
const BUCKETS = [
  { id: "short", group: "term", title: "短期", sub: "任期第 1–2 年（約 2027–2028）" },
  { id: "mid", group: "term", title: "中期", sub: "任期第 3–4 年（約 2029–2030）" },
  { id: "long", group: "term", title: "長期", sub: "任期第 5 年起（第二任）" },
  { id: "stage1", group: "staged", title: "第一階段", sub: "各主題內的推動順序" },
  { id: "stage2", group: "staged", title: "第二階段", sub: "各主題內的推動順序" },
  { id: "stage3", group: "staged", title: "第三階段", sub: "各主題內的推動順序" },
  { id: "direction", group: "whole", title: "施政方向", sub: "貫穿任期的方向與政策" },
  { id: "other", group: "whole", title: "其他時程", sub: "其他官方時程標記" },
];
// Earlier section anchors, so shared #links still land somewhere sensible.
const HASH_ALIASES = { y2027: "short", y2028: "short", y2029: "mid", y2030: "mid", y2031: "long", none: "direction" };

// Stage code in policies.json → buckets it lands in, a calendar hint, and a sort key (`at`, start
// time within the term) so each period lists the earliest steps first.
// The official label text already says "第 N 年" etc., so `when` only adds the calendar hint.
const STAGES = {
  "m1-8": { buckets: ["short"], when: "≈ 2027/1–8", at: 0 },
  year1: { buckets: ["short"], when: "≈ 2027", at: 1 },
  "year1-2": { buckets: ["short"], when: "≈ 2027–2028", at: 1 },
  "m8-18": { buckets: ["short"], when: "≈ 2027/8–2028/6", at: 2 },
  short: { buckets: ["short"], at: 3 },
  "m18-28": { buckets: ["short", "mid"], when: "≈ 2028/6–2029/4", at: 4 },
  "year2-3": { buckets: ["short", "mid"], when: "≈ 2028–2029", at: 4 },
  ay117: { buckets: ["short", "mid"], when: "2028/8–2029/7", at: 5 },
  "year3-4": { buckets: ["mid"], when: "≈ 2029–2030", at: 6 },
  mid: { buckets: ["mid"], at: 7 },
  "year4+": { buckets: ["mid", "long"], when: "≈ 2030 以後", at: 8 },
  "year5-8": { buckets: ["long"], when: "≈ 2031–2034", at: 9 },
  long: { buckets: ["long"], at: 10 },
  stage1: { buckets: ["stage1"], at: 0 },
  stage2: { buckets: ["stage2"], at: 0 },
  stage3: { buckets: ["stage3"], at: 0 },
};

const $ = (s) => document.querySelector(s);
const zh = (v) => (typeof v === "string" ? v : v?.zh || "");
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Labels like "第 1–2 年設計；第 3–4 年完工" line up with stages ["year1-2","year3-4"].
// Split them so each year shows only its own step; fall back to the whole label.
function splitLabel(label, n) {
  if (n < 2) return null;
  for (const sep of [/；/, /[；、]/]) {
    const parts = label.split(sep).map((s) => s.trim()).filter(Boolean);
    if (parts.length === n) return parts;
  }
  return null;
}

function build(D) {
  const sources = new Map(D.sources.map((s) => [s.id, s]));
  const policies = [];
  for (const isl of D.islands) {
    for (const b of isl.buildings) {
      const label = zh(b.phase?.label);
      const stages = b.phase?.stages || [];
      const parts = splitLabel(label, stages.length);
      const placements = new Map(); // bucket id → steps
      const add = (bucket, step) => {
        if (!placements.has(bucket)) placements.set(bucket, []);
        placements.get(bucket).push(step);
      };
      if (!stages.length) add("direction", null);
      stages.forEach((st, n) => {
        const def = STAGES[st];
        const step = { when: def ? def.when : st, at: def?.at ?? 99, text: parts ? parts[n] : label };
        for (const bucket of def?.buckets || ["other"]) add(bucket, step);
      });
      const src = (b.sources || []).map((id) => sources.get(id)).find(Boolean);
      policies.push({
        id: b.id,
        name: zh(b.name),
        desc: zh(b.plain),
        who: zh(b.who),
        facts: (b.facts || []).map(zh).filter(Boolean),
        label,
        splitShown: !!parts,
        island: isl,
        islandName: zh(isl.name),
        heart: isl.heart || [],
        sourceUrl: src?.url || isl.url,
        sourceTitle: zh(src?.title) || "政見原文",
        // ?focus= takes an island id only; the reader picks the policy from the island's 政策細項 list.
        // If the official page adds a per-policy parameter, point this at b.id instead.
        mapUrl: `${MAP_URL}?focus=${encodeURIComponent(isl.id)}`,
        placements,
        haystack: [b.name?.zh, b.name?.en, zh(b.plain), zh(b.who), label, zh(isl.name), ...(b.facts || []).map(zh)]
          .join(" ")
          .toLowerCase(),
      });
    }
  }
  return policies;
}

// Filter state lives in the query string so a filtered view can be shared.
const state = { q: "", heart: new Set(), island: new Set() };
function readState() {
  const p = new URLSearchParams(location.search);
  state.q = p.get("q") || "";
  state.heart = new Set((p.get("heart") || "").split(",").filter(Boolean));
  state.island = new Set((p.get("island") || "").split(",").filter(Boolean));
}
function writeState() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.heart.size) p.set("heart", [...state.heart].join(","));
  if (state.island.size) p.set("island", [...state.island].join(","));
  const qs = p.toString();
  history.replaceState(null, "", (qs ? `?${qs}` : location.pathname) + location.hash);
}

function matches(p) {
  if (state.island.size && !state.island.has(p.island.id)) return false;
  if (state.heart.size && !p.heart.some((h) => state.heart.has(h))) return false;
  if (state.q && !p.haystack.includes(state.q.toLowerCase())) return false;
  return true;
}

// Per-policy share page (p/<id>/, generated at deploy by scripts/share_pages.py). It carries the
// policy's own preview tags and redirects people to ?p=<id> on this page.
const shareUrl = (p) => new URL(`p/${encodeURIComponent(p.id)}/`, location.href).href;
// Name, then the summary, then a blank line before the call to action.
const shareText = (p) =>
  [`沈伯洋的政見：「${p.name}」`, p.desc, "", "點入看更多，並分享最觸動你的政策 — HEART 政策島 導覽器"]
    .filter((line, i) => i !== 1 || line)
    .join("\n");

function card(p, bucketId) {
  const steps = p.placements.get(bucketId).filter(Boolean);
  const stepsHtml = steps.length
    ? `<ul class="steps">${steps.map((s) => `<li>${s.when ? `<span class="when">${esc(s.when)}</span>` : ""}${esc(s.text)}</li>`).join("")}</ul>`
    : "";
  const full = p.splitShown ? `<p class="who">完整時程：${esc(p.label)}</p>` : "";
  const facts = p.facts.length
    ? `<details open><summary>細節</summary><ul>${p.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></details>`
    : "";
  const url = shareUrl(p);
  // One 分享 menu keeps the link row short however many targets there are.
  const share = !showMenu
    ? `<button type="button" class="share-copy" data-share="${esc(p.id)}">複製並分享</button>`
    : `<details class="share">
      <summary>分享</summary>
      <div class="share-menu">
        ${SHARE_TARGETS.map((t) => `<a href="${esc(t.href(url, shareText(p)))}" target="_blank" rel="noopener">${t.label}</a>`).join("")}
        <button type="button" data-copy="${esc(p.id)}">複製連結</button>
        ${nativeShare ? `<button type="button" data-native="${esc(p.id)}">其他…</button>` : ""}
      </div>
    </details>`;
  return `<article class="card" data-id="${esc(p.id)}">
    <div class="tag"><span>${String(p.island.number).padStart(2, "0")} ${esc(p.islandName)}</span><span class="heart">${esc(p.heart.join(""))}</span></div>
    <h3>${esc(p.name)}</h3>
    ${stepsHtml}
    ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ""}
    ${p.who ? `<p class="who">對象：${esc(p.who)}</p>` : ""}
    ${full}
    ${facts}
    <div class="links">
      <a href="${esc(p.mapUrl)}" target="_blank" rel="noopener" data-count="visit" data-policy="${esc(p.id)}" title="開啟「${esc(p.islandName)}」後，在「政策細項」點選「${esc(p.name)}」">拜訪政策島 ↗</a>
      <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${p.sourceUrl.startsWith("https://puma.taipei/") ? "看政見頁 - " : ""}${esc(p.sourceTitle)} ↗</a>
      ${share}
    </div>
  </article>`;
}

function render(policies) {
  const shown = policies.filter(matches);
  // Periods list the earliest steps first; stages keep topics together (data order is topic order).
  const start = (p, id) => Math.min(...p.placements.get(id).map((s) => s?.at ?? 99));
  const byBucket = BUCKETS.map((b) => ({
    ...b,
    items: shown.filter((p) => p.placements.has(b.id)).sort((x, y) => start(x, b.id) - start(y, b.id)),
  }));
  const max = Math.max(1, ...byBucket.map((b) => b.items.length));

  $("#summary").innerHTML = GROUPS.map((g) => {
    const tiles = byBucket
      .filter((b) => b.group === g.id && (b.id !== "other" || b.items.length))
      .map(
        (b) => `<a href="#${b.id}" class="${b.items.length ? "" : "empty"}">
          <b>${b.items.length}</b>${esc(b.title)}
          <div class="bar" style="width:${(b.items.length / max) * 100}%"></div></a>`
      )
      .join("");
    return `<div class="sum-group"><span class="sum-label">${esc(g.label)}</span><div class="sum-tiles">${tiles}</div></div>`;
  }).join("");

  $("#timeline").innerHTML =
    byBucket
      .filter((b) => b.items.length)
      .map(
        (b) => `<section class="bucket" id="${b.id}">
          <h2>${esc(b.title)}<small>${esc(b.sub)} · ${b.items.length} 項</small></h2>
          <div class="cards">${b.items.map((p) => card(p, b.id)).join("")}</div>
        </section>`
      )
      .join("") || `<p class="no-match">沒有符合條件的政策。</p>`;
}

// `available(value)` greys out pills that can't match the other filters; a selected pill stays
// clickable so it can still be turned off.
function chips(el, items, set, rerender, available = () => true) {
  el.innerHTML = "";
  const all = document.createElement("button");
  all.textContent = "全部";
  el.append(all);
  const buttons = items.map(({ value, label }) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.onclick = () => {
      set.has(value) ? set.delete(value) : set.add(value);
      rerender();
    };
    el.append(btn);
    return [value, btn];
  });
  all.onclick = () => {
    set.clear();
    rerender();
  };
  return () => {
    all.setAttribute("aria-pressed", String(!set.size));
    for (const [value, btn] of buttons) {
      btn.setAttribute("aria-pressed", String(set.has(value)));
      btn.disabled = !set.has(value) && !available(value);
    }
  };
}

async function main() {
  const [D, sync] = await Promise.all([
    fetch("data/policies.json").then((r) => r.json()),
    fetch("data/sync.json").then((r) => r.json()).catch(() => ({})),
  ]);
  const policies = build(D);
  const synced = sync.fetchedAt ? new Date(sync.fetchedAt).toLocaleDateString("zh-TW") : "—";
  $("#meta").textContent = `${D.islands.length} 項政策主題 · ${policies.length} 個細項 · 官方資料核對日 ${D.meta?.verifiedAt || "—"} · 本站資料更新 ${synced}`;

  readState();
  // ?p=<id> (from a shared p/<id>/ link) points at one policy. writeState() drops it from the URL
  // on the first render; if the filters in the same URL would hide that policy, they're cleared.
  const linked = policies.find((p) => p.id === new URLSearchParams(location.search).get("p"));
  if (linked && !matches(linked)) {
    state.q = "";
    state.heart.clear();
    state.island.clear();
  }
  $("#q").value = state.q;
  const islandHeart = new Map(D.islands.map((i) => [i.id, i.heart || []]));
  const sharesHeart = (id) => !state.heart.size || (islandHeart.get(id) || []).some((h) => state.heart.has(h));
  let syncHeart, syncIsland;
  const rerender = () => {
    // Picking a HEART direction drops topics outside it, so the list shows that whole direction
    // instead of nothing; with no topic left, the topic filter is back to 全部.
    for (const id of state.island) if (!sharesHeart(id)) state.island.delete(id);
    syncHeart();
    syncIsland();
    writeState();
    render(policies);
  };
  syncHeart = chips(
    $("#heart-chips"),
    Object.entries(HEART).map(([h, word]) => ({ value: h, label: `${h} ${word}` })),
    state.heart,
    rerender
  );
  syncIsland = chips(
    $("#island-chips"),
    D.islands.map((i) => ({ value: i.id, label: zh(i.name) })),
    state.island,
    rerender,
    sharesHeart
  );
  $("#q").oninput = (e) => {
    const q = e.target.value.trim();
    // A new search starts from 全部, so earlier filters don't hide matches. Only when the box goes
    // from empty to text: filters picked after that narrow the results and survive further typing.
    if (q && !state.q) {
      state.heart.clear();
      state.island.clear();
    }
    state.q = q;
    rerender();
    // Typing from deep in the list jumps back to where the results start (search bar at the top).
    const resultsTop = $(".top-band").offsetHeight;
    if (scrollY > resultsTop) window.scrollTo({ top: resultsTop });
  };
  rerender();
  // Sections only exist after the data loads, so the browser's own #hash jump misses them.
  // Old anchors (#y2027…) are rewritten to their new section, on load and on in-page hash changes.
  const jumpToHash = () => {
    let id = location.hash.slice(1);
    if (!id) return;
    if (HASH_ALIASES[id]) {
      id = HASH_ALIASES[id];
      history.replaceState(null, "", `#${id}`);
    }
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  };
  if (location.hash || linked) history.scrollRestoration = "manual";
  // A policy spanning two periods has a card in each: scroll to the first, highlight them all.
  if (linked) {
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll(`.card[data-id="${CSS.escape(linked.id)}"]`);
      cards[0]?.scrollIntoView({ block: "start" });
      for (const c of cards) c.classList.add("linked");
    });
  } else jumpToHash();
  addEventListener("hashchange", jumpToHash);

  // 分享 menus: one open at a time; outside clicks and Escape close them.
  const closeMenus = (except) => {
    for (const d of document.querySelectorAll("details.share[open]")) if (d !== except) d.open = false;
  };
  // `toggle` doesn't bubble, so listen in the capture phase. It also fires for each card's 細節
  // <details>, including when cards render with it open; only share menus are handled here.
  $("#timeline").addEventListener(
    "toggle",
    (e) => {
      if (!e.target.matches("details.share") || !e.target.open) return;
      closeMenus(e.target);
      // Open leftward when the menu would run past the right edge (right-hand column, phones).
      const menu = e.target.querySelector(".share-menu");
      menu.classList.remove("flip");
      if (menu.getBoundingClientRect().right > document.documentElement.clientWidth - 8) menu.classList.add("flip");
    },
    true
  );
  document.addEventListener("click", (e) => closeMenus(e.target.closest("details.share")));
  document.addEventListener("keydown", (e) => {
    const open = document.querySelector("details.share[open]");
    if (e.key !== "Escape" || !open) return;
    open.open = false;
    open.querySelector("summary").focus();
  });
  $("#timeline").addEventListener("click", async (e) => {
    const item = e.target.closest(".share-menu a, .share-menu button");
    if (!item) return;
    const menu = item.closest("details");
    const p = policies.find((x) => x.id === (item.dataset.copy || item.dataset.native));
    if (item.dataset.native) {
      menu.open = false;
      try {
        await navigator.share({ title: p.name, text: shareText(p), url: shareUrl(p) });
      } catch {} // dismissed
    } else if (item.dataset.copy) {
      item.textContent = (await copyText(shareUrl(p))) ? "已複製 ✓" : "複製失敗";
      setTimeout(() => {
        item.textContent = "複製連結";
        menu.open = false;
      }, 1200);
    } else menu.open = false; // a share link opened in a new tab
  });

  // 複製並分享: the share text plus link, ready to paste as a post, a reply or a chat message.
  $("#timeline").addEventListener("click", async (e) => {
    const btn = e.target.closest("button.share-copy");
    if (!btn) return;
    const p = policies.find((x) => x.id === btn.dataset.share);
    countPolicy("copy-share", p.id);
    if (await copyText(`${shareText(p)}\n${shareUrl(p)}`)) {
      toast("已複製！貼到 Threads 回覆、LINE 或任何地方分享吧");
      btn.textContent = "已複製 ✓";
      setTimeout(() => (btn.textContent = "複製並分享"), 2000);
    } else toast("複製失敗，請改用瀏覽器開啟本頁再試一次");
  });
}

// Back-to-top button shows once the header has scrolled away; hidden, it's out of the tab order.
function backToTop() {
  const btn = $("#to-top");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  new IntersectionObserver(([entry]) => {
    const show = !entry.isIntersecting;
    btn.classList.toggle("show", show);
    btn.tabIndex = show ? 0 : -1;
    btn.setAttribute("aria-hidden", String(!show));
  }).observe($(".top-band"));
  btn.onclick = () => {
    window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  };
}

backToTop();
main().catch((err) => {
  console.error(err);
  $("#meta").textContent = "資料載入失敗。";
});
