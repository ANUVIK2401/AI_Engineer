/* ============================================================
   AI Eng Prep — Interview Q&A renderer
   Shared by all pages under pages/interview/
   ============================================================ */

const QA_SECTIONS = [
  { id: '01', slug: 'llm-fundamentals',  title: 'LLM Fundamentals',        count: 66, file: 'qa-01-llm-fundamentals.js' },
  { id: '02', slug: 'prompt-engineering',title: 'Prompt Engineering',      count: 30, file: 'qa-02-prompt-engineering.js' },
  { id: '03', slug: 'rag',               title: 'RAG',                     count: 37, file: 'qa-03-rag.js' },
  { id: '04', slug: 'vector-db',         title: 'Vector DBs & Embeddings', count: 23, file: 'qa-04-vector-db.js' },
  { id: '05', slug: 'agents',            title: 'AI Agents',               count: 45, file: 'qa-05-agents.js' },
  { id: '06', slug: 'fine-tuning',       title: 'Fine-Tuning',             count: 26, file: 'qa-06-fine-tuning.js' },
  { id: '07', slug: 'system-design',     title: 'AI System Design',        count: 46, file: 'qa-07-system-design.js' },
  { id: '08', slug: 'llmops',            title: 'LLMOps & Production',     count: 44, file: 'qa-08-llmops.js' },
  { id: '09', slug: 'evaluation',        title: 'Evaluation & Testing',    count: 31, file: 'qa-09-evaluation.js' },
  { id: '10', slug: 'safety-ethics',     title: 'Safety & Ethics',         count: 44, file: 'qa-10-safety-ethics.js' },
  { id: '11', slug: 'multimodal',        title: 'Multimodal AI',           count: 26, file: 'qa-11-multimodal.js' },
  { id: '12', slug: 'infrastructure',    title: 'Infrastructure & Scale',  count: 25, file: 'qa-12-infrastructure.js' },
  { id: '13', slug: 'coding',            title: 'Coding & Implementation', count: 22, file: 'qa-13-coding.js' },
  { id: '14', slug: 'behavioral',        title: 'Behavioral & Scenarios',  count: 22, file: 'qa-14-behavioral.js' },
];

const QA_TOTAL = QA_SECTIONS.reduce((n, s) => n + s.count, 0);

/* Derived fields so any hub layout can consume the same list */
const QA_BLURBS = {"llm-fundamentals": "Architecture, attention, tokenization, sampling, and the failure modes interviewers actually probe.", "prompt-engineering": "Reasoning patterns, structured output, injection defense, and the failure modes that show up in production.", "rag": "Chunking, hybrid search, reranking, evaluation, and the failure modes that make RAG systems quietly wrong.", "vector-db": "ANN indexes, similarity metrics, quantization, multi-tenancy, and the migration problems nobody plans for.", "agents": "Agent loops, tool design, memory, orchestration, and the safety boundaries that keep autonomy from becoming an incident.", "fine-tuning": "LoRA, QLoRA, RLHF, dataset construction, and knowing when weights are the wrong answer.", "system-design": "End-to-end architectures, tradeoffs, capacity planning, and the failure modes that surface at scale.", "llmops": "Serving, quantization, observability, cost control, and keeping LLM systems alive under load.", "evaluation": "Eval-driven development, LLM judges, red teaming, regression suites, and statistical rigor.", "safety-ethics": "Injection, bias, privacy law, auditability, and the incident-shaped questions where the right answer is architectural, not a prompt.", "multimodal": "Vision-language models, CLIP, diffusion, speech, document understanding, and cross-modal failure modes.", "infrastructure": "GPUs, parallelism, batching, speculative decoding, KV cache management, and serving economics.", "coding": "The implementations interviewers actually ask you to write — with the details that separate working code from a sketch.", "behavioral": "Judgment, tradeoffs, stakeholder communication — where senior candidates are actually separated from mid-level."};
QA_SECTIONS.forEach(s => {
  s.page  = `${s.id}-${s.slug}.html`;   // path relative to pages/interview/
  s.label = s.title;
  s.blurb = QA_BLURBS[s.slug] || '';
});
const QA_PROGRESS_KEY = 'ai_eng_qa_progress_v1';
const QA_BOOKMARK_KEY = 'ai_eng_qa_bookmarks_v1';

/* ── storage helpers ─────────────────────────────────────── */

function qaLoad(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); }
  catch { return {}; }
}
function qaSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function qaIsDone(slug, i) {
  const d = qaLoad(QA_PROGRESS_KEY);
  return !!(d[slug] && d[slug][i]);
}
function qaToggleDone(slug, i) {
  const d = qaLoad(QA_PROGRESS_KEY);
  if (!d[slug]) d[slug] = {};
  d[slug][i] = !d[slug][i];
  qaSave(QA_PROGRESS_KEY, d);
  return d[slug][i];
}
function qaDoneCount(slug) {
  const d = qaLoad(QA_PROGRESS_KEY);
  return d[slug] ? Object.values(d[slug]).filter(Boolean).length : 0;
}
function qaTotalDone() {
  return QA_SECTIONS.reduce((n, s) => n + qaDoneCount(s.slug), 0);
}

function qaIsBookmarked(slug, i) {
  const d = qaLoad(QA_BOOKMARK_KEY);
  return !!(d[slug] && d[slug][i]);
}
function qaToggleBookmark(slug, i) {
  const d = qaLoad(QA_BOOKMARK_KEY);
  if (!d[slug]) d[slug] = {};
  if (d[slug][i]) delete d[slug][i]; else d[slug][i] = true;
  if (!Object.keys(d[slug]).length) delete d[slug];
  qaSave(QA_BOOKMARK_KEY, d);
  return qaIsBookmarked(slug, i);
}
function qaBookmarkCount(slug) {
  const d = qaLoad(QA_BOOKMARK_KEY);
  return d[slug] ? Object.keys(d[slug]).length : 0;
}
function qaAllBookmarks() {
  const d = qaLoad(QA_BOOKMARK_KEY);
  const out = [];
  QA_SECTIONS.forEach(s => {
    Object.keys(d[s.slug] || {}).forEach(i => out.push({ section: s, index: Number(i) }));
  });
  return out;
}

/* ── section page rendering ──────────────────────────────── */

function qaBadgeClass(tag) {
  if (tag === 'CRITICAL') return 'badge-critical';
  if (tag === 'TRADEOFF') return 'badge-tradeoff';
  return 'badge-faq';
}

function renderQASection(section) {
  const list = document.getElementById('qa-list');
  if (!list) return;

  list.innerHTML = section.questions.map((item, i) => {
    const done = qaIsDone(section.slug, i);
    const marked = qaIsBookmarked(section.slug, i);
    const tags = (item.tags || []).map(t =>
      `<span class="badge ${qaBadgeClass(t)}">[${t}]</span>`).join('');
    return `
      <article class="qa-card${done ? ' is-done' : ''}" id="q${i + 1}" data-index="${i}">
        <div class="qa-head">
          <button class="qa-dot" data-action="done" aria-label="Mark as reviewed"
                  title="${done ? 'Mark as not reviewed' : 'Mark as reviewed'}"></button>
          <div class="qa-q">
            <span class="qa-num">Q${i + 1}</span>
            <h3>${item.q}</h3>
            <div class="qa-tags">${tags}</div>
          </div>
          <button class="qa-mark${marked ? ' is-on' : ''}" data-action="bookmark"
                  aria-label="Bookmark question" title="Bookmark">★</button>
        </div>
        <button class="qa-toggle" data-action="toggle">
          <span class="chevron">▸</span> Show answer
        </button>
        <div class="qa-a">${item.a}</div>
      </article>`;
  }).join('');

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('.qa-card');
    const idx = Number(card.dataset.index);

    if (btn.dataset.action === 'toggle') {
      const open = card.classList.toggle('is-open');
      btn.querySelector('.chevron').textContent = open ? '▾' : '▸';
      btn.childNodes[btn.childNodes.length - 1].textContent =
        open ? ' Hide answer' : ' Show answer';
    } else if (btn.dataset.action === 'done') {
      const now = qaToggleDone(section.slug, idx);
      card.classList.toggle('is-done', now);
      btn.title = now ? 'Mark as not reviewed' : 'Mark as reviewed';
      updateQAProgress(section);
    } else if (btn.dataset.action === 'bookmark') {
      btn.classList.toggle('is-on', qaToggleBookmark(section.slug, idx));
    }
  });

  updateQAProgress(section);
  initQASearch(section);
  jumpToHash();
}

function updateQAProgress(section) {
  const done = qaDoneCount(section.slug);
  const total = section.questions.length;
  const c = document.getElementById('qa-progress-counter');
  if (c) c.textContent = `${done} / ${total} reviewed`;
  const bar = document.getElementById('qa-progress-bar');
  if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`;
}

/* ── search / filter ─────────────────────────────────────── */

function initQASearch(section) {
  const input = document.getElementById('qa-search');
  const chips = document.querySelectorAll('.qa-filter');
  if (!input) return;

  let filter = 'all';
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('.qa-card').forEach(card => {
      const i = Number(card.dataset.index);
      const item = section.questions[i];
      const hay = (item.q + ' ' + item.a).toLowerCase();
      let ok = !q || hay.includes(q);
      if (ok && filter === 'bookmarked') ok = qaIsBookmarked(section.slug, i);
      if (ok && filter === 'unread') ok = !qaIsDone(section.slug, i);
      if (ok && filter === 'critical') ok = (item.tags || []).includes('CRITICAL');
      card.hidden = !ok;
      if (ok) shown++;
    });
    const empty = document.getElementById('qa-empty');
    if (empty) empty.hidden = shown > 0;
  };

  input.addEventListener('input', apply);
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filter = chip.dataset.filter;
    apply();
  }));
}

function jumpToHash() {
  if (!location.hash) return;
  const el = document.querySelector(location.hash);
  if (!el) return;
  el.classList.add('is-open');
  const btn = el.querySelector('.qa-toggle');
  if (btn) {
    btn.querySelector('.chevron').textContent = '▾';
    btn.childNodes[btn.childNodes.length - 1].textContent = ' Hide answer';
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── interview nav (sidebar + bottom bar) ────────────────── */

function qaBase() {
  return location.pathname.includes('/pages/interview/') ? '../../' : './';
}

function buildQANav() {
  const base = qaBase();
  const current = QA_SECTIONS.find(s => location.pathname.includes(s.slug));
  const links = QA_SECTIONS.map(s => {
    const done = qaDoneCount(s.slug);
    const pct = Math.round((done / s.count) * 100);
    return `
      <li>
        <a href="${base}pages/interview/${s.id}-${s.slug}.html"
           class="${current && current.slug === s.slug ? 'active' : ''}">
          <span class="nav-num">${s.id}</span>
          <span class="nav-label">${s.title}</span>
          <span class="nav-count">${s.count}</span>
        </a>
        <div class="sidebar-progress-mini"><div style="width:${pct}%"></div></div>
      </li>`;
  }).join('');

  return `
    <nav class="sidebar" id="sidebar">
      <a href="${base}index.html" class="sidebar-brand">AI Eng <span>Prep</span></a>
      <a href="${base}interview.html" class="sidebar-section-link">&#8592; Question Bank</a>
      <ul class="sidebar-nav">${links}</ul>
    </nav>`;
}

function injectQANav() {
  const shell = document.querySelector('.app-shell');
  if (shell) shell.insertAdjacentHTML('afterbegin', buildQANav());
}

document.addEventListener('DOMContentLoaded', () => {
  injectQANav();
  if (typeof window.QA_SECTION !== 'undefined') renderQASection(window.QA_SECTION);
});
