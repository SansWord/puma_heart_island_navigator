// Turns the HEART policy-island data into a by-year timeline.
// Data is downloaded at deploy time (daily) from https://puma.taipei/heart-island-assets/policies.json
// The official file is served for puma.taipei's own pages (no CORS header), so this page reads its own copy.

const MAP_URL = "https://puma.taipei/heart-island";

// HEART letters as named on https://puma.taipei/heart.
const HEART = { H: "空間", E: "機會", A: "陪伴", R: "韌性", T: "時間" };

// Term assumed to start 2026-12-25, so term year N ≈ calendar year 2026 + N.
const BUCKETS = [
  { id: "y2027", title: "2027", sub: "任期第 1 年" },
  { id: "y2028", title: "2028", sub: "任期第 2 年" },
  { id: "y2029", title: "2029", sub: "任期第 3 年" },
  { id: "y2030", title: "2030", sub: "任期第 4 年" },
  { id: "y2031", title: "2031–2034", sub: "任期第 5–8 年（第二任）" },
  { id: "short", title: "短期／初期", sub: "近程推動" },
  { id: "mid", title: "中期", sub: "中程推動" },
  { id: "long", title: "長期", sub: "長程推動" },
  { id: "stage1", title: "第一階段", sub: "分階段推動" },
  { id: "stage2", title: "第二階段", sub: "分階段推動" },
  { id: "stage3", title: "第三階段", sub: "分階段推動" },
  { id: "direction", title: "施政方向", sub: "貫穿任期的方向與政策" },
  { id: "other", title: "其他時程", sub: "其他官方時程標記" },
];

// Stage code in policies.json → buckets it lands in, plus an approximate calendar range.
// The official label text already says "第 N 年" etc., so `when` only adds the calendar hint.
const STAGES = {
  "m1-8": { buckets: ["y2027"], when: "≈ 2027/1–8" },
  "m8-18": { buckets: ["y2027", "y2028"], when: "≈ 2027/8–2028/6" },
  "m18-28": { buckets: ["y2028", "y2029"], when: "≈ 2028/6–2029/4" },
  year1: { buckets: ["y2027"], when: "≈ 2027" },
  "year1-2": { buckets: ["y2027", "y2028"], when: "≈ 2027–2028" },
  "year2-3": { buckets: ["y2028", "y2029"], when: "≈ 2028–2029" },
  "year3-4": { buckets: ["y2029", "y2030"], when: "≈ 2029–2030" },
  "year4+": { buckets: ["y2030", "y2031"], when: "≈ 2030 以後" },
  "year5-8": { buckets: ["y2031"], when: "≈ 2031–2034" },
  ay117: { buckets: ["y2028", "y2029"], when: "2028/8–2029/7" },
  short: { buckets: ["short"] },
  mid: { buckets: ["mid"] },
  long: { buckets: ["long"] },
  stage1: { buckets: ["stage1"] },
  stage2: { buckets: ["stage2"] },
  stage3: { buckets: ["stage3"] },
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
        const step = { when: def ? def.when : st, text: parts ? parts[n] : label };
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

function card(p, bucketId) {
  const steps = p.placements.get(bucketId).filter(Boolean);
  const stepsHtml = steps.length
    ? `<ul class="steps">${steps.map((s) => `<li>${s.when ? `<span class="when">${esc(s.when)}</span>` : ""}${esc(s.text)}</li>`).join("")}</ul>`
    : "";
  const full = p.splitShown ? `<p class="who">完整時程：${esc(p.label)}</p>` : "";
  const facts = p.facts.length
    ? `<details open><summary>細節</summary><ul>${p.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></details>`
    : "";
  return `<article class="card">
    <div class="tag"><span>${String(p.island.number).padStart(2, "0")} ${esc(p.islandName)}</span><span class="heart">${esc(p.heart.join(""))}</span></div>
    <h3>${esc(p.name)}</h3>
    ${stepsHtml}
    ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ""}
    ${p.who ? `<p class="who">對象：${esc(p.who)}</p>` : ""}
    ${full}
    ${facts}
    <div class="links">
      <a href="${esc(p.mapUrl)}" target="_blank" rel="noopener" title="開啟「${esc(p.islandName)}」後，在「政策細項」點選「${esc(p.name)}」">拜訪政策島 ↗</a>
      <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${p.sourceUrl.startsWith("https://puma.taipei/") ? "拜訪網站政策專區 - " : ""}${esc(p.sourceTitle)} ↗</a>
    </div>
  </article>`;
}

function render(policies) {
  const shown = policies.filter(matches);
  const byBucket = BUCKETS.map((b) => ({ ...b, items: shown.filter((p) => p.placements.has(b.id)) }));
  const max = Math.max(1, ...byBucket.map((b) => b.items.length));

  $("#summary").innerHTML = byBucket
    .filter((b) => b.id !== "other" || b.items.length)
    .map(
      (b) => `<a href="#${b.id}" class="${b.items.length ? "" : "empty"}">
        <b>${b.items.length}</b>${esc(b.title)}
        <div class="bar" style="width:${(b.items.length / max) * 100}%"></div></a>`
    )
    .join("");

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
  $("#meta").textContent = `${D.islands.length} 個主題 · ${policies.length} 項政策 · 官方資料核對日 ${D.meta?.verifiedAt || "—"} · 本站資料更新 ${synced}`;

  readState();
  $("#q").value = state.q;
  const islandHeart = new Map(D.islands.map((i) => [i.id, i.heart || []]));
  let syncHeart, syncIsland;
  const rerender = () => {
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
    (id) => !state.heart.size || islandHeart.get(id).some((h) => state.heart.has(h))
  );
  $("#q").oninput = (e) => {
    state.q = e.target.value.trim();
    rerender();
  };
  rerender();
  // Sections only exist after the data loads, so the browser's own #hash jump misses them.
  if (location.hash) {
    history.scrollRestoration = "manual";
    requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
  }
}

main().catch((err) => {
  console.error(err);
  $("#meta").textContent = "資料載入失敗。";
});
