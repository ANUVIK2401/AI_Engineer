/* ============================================================
   AI Eng Prep — shared nav, progress tracking, card interactions
   ============================================================ */

const NAV_MODULES = [
  { id: '01', slug: 'foundations',           label: 'Foundations',            path: 'pages/01-foundations.html',            topics: 6  },
  { id: '02', slug: 'ml-core',               label: 'ML Core',                 path: 'pages/02-ml-core.html',                topics: 7  },
  { id: '03', slug: 'deep-learning',         label: 'Deep Learning',           path: 'pages/03-deep-learning.html',          topics: 8  },
  { id: '04', slug: 'transformers-llms',     label: 'Transformers & LLMs',     path: 'pages/04-transformers-llms.html',      topics: 10 },
  { id: '05', slug: 'rag-vectordb',          label: 'RAG & Vector DBs',        path: 'pages/05-rag-vectordb.html',           topics: 10 },
  { id: '06', slug: 'agents-langchain',      label: 'Agents & LangChain',      path: 'pages/06-agents-langchain.html',       topics: 10 },
  { id: '07', slug: 'inference-optimization',label: 'Inference Optimization',  path: 'pages/07-inference-optimization.html', topics: 9  },
  { id: '08', slug: 'mlops-production',      label: 'MLOps & Production',      path: 'pages/08-mlops-production.html',       topics: 10 },
];

const PROGRESS_KEY = 'ai_eng_progress_v2';

function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '../' : './';
}

function getCurrentModuleSlug() {
  const path = window.location.pathname;
  for (const mod of NAV_MODULES) {
    if (path.includes(mod.slug)) return mod.slug;
  }
  return null;
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

function getModuleCompletedCount(slug) {
  const data = loadProgress();
  const mod = data[slug];
  if (!mod) return 0;
  return Object.values(mod).filter(Boolean).length;
}

function isTopicRead(slug, topicId) {
  const data = loadProgress();
  return !!(data[slug] && data[slug][topicId]);
}

function toggleTopicRead(slug, topicId) {
  const data = loadProgress();
  if (!data[slug]) data[slug] = {};
  data[slug][topicId] = !data[slug][topicId];
  saveProgress(data);
  return data[slug][topicId];
}

function getOverallProgress() {
  let total = 0;
  let completed = 0;
  NAV_MODULES.forEach(m => {
    total += m.topics;
    completed += getModuleCompletedCount(m.slug);
  });
  return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
}

function getModulesCompleteCount() {
  return NAV_MODULES.filter(m => getModuleCompletedCount(m.slug) >= m.topics).length;
}

function buildSidebar() {
  const base = getBasePath();
  const current = getCurrentModuleSlug();

  const links = NAV_MODULES.map(m => {
    const done = getModuleCompletedCount(m.slug);
    const pct = Math.round((done / m.topics) * 100);
    const isActive = m.slug === current;
    return `
      <li>
        <a href="${base}${m.path}" class="${isActive ? 'active' : ''}">
          <span class="nav-num">${m.id}</span>
          <span class="nav-label">${m.label}</span>
        </a>
        <div class="sidebar-progress-mini"><div style="width:${pct}%"></div></div>
      </li>
    `;
  }).join('');

  return `
    <nav class="sidebar" id="sidebar">
      <a href="${base}index.html" class="sidebar-brand">AI Eng <span>Prep</span></a>
      <ul class="sidebar-nav">${links}</ul>
    </nav>
  `;
}

function buildBottomNav() {
  const base = getBasePath();
  const current = getCurrentModuleSlug();
  const homeActive = !current;

  const links = NAV_MODULES.map(m => `
    <a href="${base}${m.path}" class="${m.slug === current ? 'active' : ''}">${m.id}</a>
  `).join('');

  return `
    <nav class="bottom-nav" id="bottom-nav">
      <a href="${base}index.html" class="${homeActive ? 'active' : ''}">HOME</a>
      ${links}
    </nav>
  `;
}

function injectNav() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  shell.insertAdjacentHTML('afterbegin', buildSidebar());
  document.body.insertAdjacentHTML('beforeend', buildBottomNav());
}

/* ── Topic card read-tracking ────────────────────────────── */

function initTopicCards() {
  const slug = getCurrentModuleSlug();
  if (!slug) return;

  document.querySelectorAll('.card[data-topic-id]').forEach(card => {
    const topicId = card.getAttribute('data-topic-id');
    if (!card.id) card.id = topicId; // anchor target for deep links (mindmap, sidebar)
    if (isTopicRead(slug, topicId)) card.classList.add('is-read');

    const dot = card.querySelector('.card-read-dot');
    if (dot) {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      const setTitle = () => dot.setAttribute('title',
        card.classList.contains('is-read') ? 'Mark as unread' : 'Mark as read');
      setTitle();
      const toggle = () => {
        const nowRead = toggleTopicRead(slug, topicId);
        card.classList.toggle('is-read', nowRead);
        setTitle();
        updateModuleProgressUI();
      };
      dot.addEventListener('click', toggle);
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    }
  });

  updateModuleProgressUI();
}

function updateModuleProgressUI() {
  const slug = getCurrentModuleSlug();
  if (!slug) return;
  const mod = NAV_MODULES.find(m => m.slug === slug);
  if (!mod) return;
  const done = getModuleCompletedCount(slug);

  const counter = document.getElementById('module-progress-counter');
  if (counter) counter.textContent = `${done} / ${mod.topics} read`;

  const bar = document.getElementById('module-progress-bar');
  if (bar) bar.style.width = `${Math.round((done / mod.topics) * 100)}%`;

  const navLink = document.querySelector(`.sidebar-nav a[href*="${mod.slug}"]`);
  if (navLink) {
    const miniBar = navLink.parentElement.querySelector('.sidebar-progress-mini > div');
    if (miniBar) miniBar.style.width = `${Math.round((done / mod.topics) * 100)}%`;
  }
}

/* ── Interview section toggles ───────────────────────────── */

function initInterviewToggles() {
  document.querySelectorAll('.interview-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = toggle.nextElementSibling;
      const open = toggle.classList.toggle('open');
      if (content) content.classList.toggle('open', open);
    });
  });
}

/* ── Interview Simulator show/hide ───────────────────────── */

function initSimulator() {
  document.querySelectorAll('.sim-show-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      const answer = btn.closest('.sim-card').querySelector('.sim-answer');
      const open = answer.classList.toggle('open');
      btn.textContent = open ? 'Hide Answer' : 'Show Answer';
    });
  });
}

function scrollToHashCard() {
  // card ids are assigned at runtime, so honor deep links (e.g. from the knowledge map) manually
  if (!window.location.hash) return;
  const target = document.getElementById(window.location.hash.slice(1));
  if (target && target.classList.contains('card')) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  initTopicCards();
  initInterviewToggles();
  initSimulator();
  scrollToHashCard();
});
