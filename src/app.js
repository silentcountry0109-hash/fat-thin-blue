/* 胖瘦藍本 · 解答卷閱讀器 · 典陸教育 Danlu Education
 * Vanilla JS, no build step. Hash-based routing: #/<book>/<roundId>
 *   book   = "pan" | "slim"
 *   roundId = "r01".."r80" for pan, "s01".."s26" for slim
 */

const STATE = {
  manifest: null,
  index: null,
  currentBook: null,    // "pan" | "slim"
  currentRoundId: null, // e.g. "r01", "s05"
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

async function loadData() {
  if (window.MANIFEST && window.SEARCH_INDEX) {
    STATE.manifest = window.MANIFEST;
    STATE.index = window.SEARCH_INDEX;
    return;
  }
  const [m, i] = await Promise.all([
    fetch("data/manifest.json").then(r => r.json()),
    fetch("data/index.json").then(r => r.json()),
  ]);
  STATE.manifest = m;
  STATE.index = i;
}

/* ---------- lookups ---------------------------------------------------- */
function bookMeta(id) {
  return STATE.manifest.books.find(b => b.id === id);
}
function roundMeta(bookId, roundId) {
  const b = bookMeta(bookId);
  return b && b.rounds.find(r => r.id === roundId);
}

/* ---------- render sidebar -------------------------------------------- */
function renderSidebar() {
  const root = $("#books");
  root.innerHTML = "";
  for (const b of STATE.manifest.books) {
    root.appendChild(renderBook(b));
  }
  // Default: expand 胖藍本, collapse 瘦藍本
  const panEl = root.querySelector('[data-book-id="pan"]');
  const slimEl = root.querySelector('[data-book-id="slim"]');
  if (slimEl) slimEl.classList.add("collapsed");
  // Inside 胖藍本, collapse all 3 volumes by default; inside 瘦藍本, collapse all topics
  $$(".volume, .topic", root).forEach(el => el.classList.add("collapsed"));
}

function renderBook(b) {
  const wrap = document.createElement("div");
  wrap.className = "book";
  wrap.dataset.bookId = b.id;

  const head = document.createElement("div");
  head.className = "book-head";
  head.innerHTML = `
    <span class="book-label">${b.name_zh}</span>
    <span class="book-sub">${b.subtitle}</span>
    <span class="book-caret">▾</span>`;
  head.addEventListener("click", () => wrap.classList.toggle("collapsed"));
  wrap.appendChild(head);

  const body = document.createElement("div");
  body.className = "book-body";
  if (b.id === "pan") {
    // Group rounds by volume
    const byVol = new Map();
    for (const v of b.volumes) byVol.set(v.id, { ...v, rounds: [] });
    for (const r of b.rounds) byVol.get(r.volume).rounds.push(r);
    for (const v of byVol.values()) {
      body.appendChild(renderGroup({
        className: "volume",
        key: `vol-${v.id}`,
        label: v.name_zh,
        sub: v.range,
        rounds: v.rounds,
        bookId: b.id,
      }));
    }
  } else {
    // slim: group by topic (preserve topic order from manifest)
    const byTopic = new Map();
    for (const t of b.topics) byTopic.set(t.name_zh, { ...t, rounds: [] });
    for (const r of b.rounds) {
      if (!byTopic.has(r.topic)) byTopic.set(r.topic, { id: r.topic, name_zh: r.topic, rounds: [] });
      byTopic.get(r.topic).rounds.push(r);
    }
    for (const t of byTopic.values()) {
      body.appendChild(renderGroup({
        className: "topic",
        key: `topic-${t.id}`,
        label: t.name_zh,
        sub: `${t.rounds.length} 回`,
        rounds: t.rounds,
        bookId: b.id,
      }));
    }
  }
  wrap.appendChild(body);
  return wrap;
}

function renderGroup({ className, key, label, sub, rounds, bookId }) {
  const el = document.createElement("div");
  el.className = className;
  el.dataset.groupKey = key;

  const head = document.createElement("div");
  head.className = `${className}-head`;
  head.innerHTML = `
    <span class="${className}-label">${label}</span>
    <span class="${className}-range">${sub}</span>
    <span class="${className}-caret">▾</span>`;
  head.addEventListener("click", () => el.classList.toggle("collapsed"));
  el.appendChild(head);

  const ul = document.createElement("ul");
  ul.className = "rounds";
  for (const r of rounds) {
    const li = document.createElement("li");
    li.className = "round-item";
    li.dataset.bookId = bookId;
    li.dataset.roundId = r.id;
    // Slim labels: show just 第N回 (topic already in the group header)
    const roundLabel = bookId === "slim" ? `第 ${r.round} 回` : r.label_zh;
    const num = bookId === "pan"
      ? String(r.round).padStart(2, "0")
      : String(r.round);
    li.innerHTML = `
      <span class="round-num">${num}</span>
      <span class="round-label">${roundLabel}</span>
      <span class="round-meta">${r.pages} 頁</span>
    `;
    li.addEventListener("click", () => selectRound(bookId, r.id));
    ul.appendChild(li);
  }
  el.appendChild(ul);
  return el;
}

/* ---------- viewer ---------------------------------------------------- */
function imgSrc(bookId, r, pageIdx) {
  if (bookId === "pan") {
    const pad = String(r.round).padStart(2, "0");
    return `assets/pages/answer/r${pad}-${pageIdx}.jpg`;
  }
  return `assets/pages/slim-answer/${r.id}-${pageIdx}.jpg`;
}

function renderViewer() {
  const viewer = $("#viewer");
  const crumb = $("#breadcrumb");

  if (!STATE.currentBook || !STATE.currentRoundId) {
    return;
  }
  const b = bookMeta(STATE.currentBook);
  const r = roundMeta(STATE.currentBook, STATE.currentRoundId);
  if (!r) return;

  // breadcrumb
  let groupLabel = "";
  if (b.id === "pan") {
    const v = b.volumes.find(vv => vv.id === r.volume);
    groupLabel = v ? v.name_zh : "";
  } else {
    groupLabel = r.topic || "";
  }
  crumb.innerHTML = `
    <span class="crumb-vol">${b.name_zh}</span>
    <span class="sep">／</span>
    <span class="crumb-vol">${groupLabel}</span>
    <span class="sep">／</span>
    <span class="crumb-round">${b.id === "slim" ? `第 ${r.round} 回` : r.label_zh}</span>
    <span class="sep">／</span>
    <span class="crumb-vol">解答卷</span>
  `;

  viewer.innerHTML = "";
  viewer.insertAdjacentHTML("beforeend", `
    <div class="viewer-meta">
      <span>${b.name_zh}</span>
      <span class="divider"></span>
      <span>${groupLabel}</span>
      <span class="divider"></span>
      <span>${b.id === "slim" ? `第 ${r.round} 回` : r.label_zh}</span>
      <span class="divider"></span>
      <span>解答卷</span>
    </div>
  `);

  const n = r.pages;
  for (let i = 1; i <= n; i++) {
    const src = imgSrc(b.id, r, i);
    const card = document.createElement("div");
    card.className = "page-card";
    card.innerHTML = `
      <img loading="lazy" src="${src}" alt="${r.label_zh} 解答卷 第 ${i} 頁" />
      <div class="page-num">${i} / ${n}</div>
    `;
    viewer.appendChild(card);
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------- interactions ---------------------------------------------- */
function selectRound(bookId, roundId) {
  STATE.currentBook = bookId;
  STATE.currentRoundId = roundId;
  updateActiveSidebar();
  expandToActive();
  renderViewer();
  writeHash();
  document.body.classList.remove("nav-open");
}

function updateActiveSidebar() {
  $$(".round-item").forEach(el => {
    const match = el.dataset.bookId === STATE.currentBook
               && el.dataset.roundId === STATE.currentRoundId;
    el.classList.toggle("active", match);
  });
}

function expandToActive() {
  // Ensure the active book + group is expanded
  const li = document.querySelector(
    `.round-item[data-book-id="${STATE.currentBook}"][data-round-id="${STATE.currentRoundId}"]`
  );
  if (!li) return;
  // Walk up and remove "collapsed" on ancestors
  let node = li.parentElement;
  while (node && node !== document.body) {
    if (node.classList && node.classList.contains("collapsed")) {
      node.classList.remove("collapsed");
    }
    node = node.parentElement;
  }
  // Scroll into view within sidebar
  li.scrollIntoView({ block: "nearest" });
}

/* ---------- search ---------------------------------------------------- */
function setupSearch() {
  const input = $("#q");
  const hint = $("#search-hint");
  let timer = null;

  // Total round count for the default hint
  const total = STATE.manifest.books.reduce((s, b) => s + b.rounds.length, 0);
  hint.innerHTML = `共 <b>${total}</b> 回可檢索`;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(input.value.trim()), 120);
  });

  function runSearch(q) {
    $$(".round-item").forEach(el => el.classList.remove("hit"));
    if (!q) {
      hint.innerHTML = `共 <b>${total}</b> 回可檢索`;
      return;
    }
    const needle = q.toLowerCase();
    let hits = 0;
    for (const [key, rec] of Object.entries(STATE.index)) {
      const text = (rec.text || "").toLowerCase();
      if (!text.includes(needle)) continue;
      hits++;
      const sel = `.round-item[data-book-id="${rec.book}"][data-round-id="${rec.id}"]`;
      const el = document.querySelector(sel);
      if (el) el.classList.add("hit");
    }
    hint.innerHTML = hits
      ? `命中 <b>${hits}</b> 回 · 已在邊欄標示`
      : `無符合結果`;
  }
}

/* ---------- hash routing ---------------------------------------------- */
function readHash() {
  // #/pan/r05  or  #/slim/s12
  const m = location.hash.match(/^#\/(pan|slim)\/([rs]\d{1,2})$/);
  if (!m) return;
  const bookId = m[1];
  const roundId = m[2].length === 2 ? m[2][0] + "0" + m[2][1] : m[2]; // normalize r5 -> r05
  if (roundMeta(bookId, roundId)) {
    STATE.currentBook = bookId;
    STATE.currentRoundId = roundId;
  }
}
function writeHash() {
  if (!STATE.currentBook || !STATE.currentRoundId) return;
  const h = `#/${STATE.currentBook}/${STATE.currentRoundId}`;
  if (location.hash !== h) history.replaceState(null, "", h);
}

/* ---------- menu toggle ---------------------------------------------- */
function setupMenu() {
  const btn = $("#menu-toggle");
  if (btn) btn.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });
}

/* ---------- init ------------------------------------------------------ */
(async function init() {
  await loadData();
  renderSidebar();
  setupSearch();
  setupMenu();
  readHash();
  if (STATE.currentBook && STATE.currentRoundId) {
    updateActiveSidebar();
    expandToActive();
    renderViewer();
  }
  window.addEventListener("hashchange", () => {
    readHash();
    updateActiveSidebar();
    expandToActive();
    renderViewer();
  });
})();
