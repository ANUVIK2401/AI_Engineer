const NAV_MODULES = [
  { id: 'fundamentals',  label: 'Fundamentals',   icon: '🔢', path: 'pages/fundamentals.html',   topics: 8  },
  { id: 'ml-core',       label: 'ML Core',         icon: '📐', path: 'pages/ml-core.html',        topics: 10 },
  { id: 'deep-learning', label: 'Deep Learning',   icon: '🧠', path: 'pages/deep-learning.html',  topics: 12 },
  { id: 'llms',          label: 'LLMs',            icon: '💬', path: 'pages/llms.html',           topics: 9  },
  { id: 'rag',           label: 'RAG Systems',     icon: '🔍', path: 'pages/rag.html',            topics: 7  },
  { id: 'agents',        label: 'AI Agents',       icon: '🤖', path: 'pages/agents.html',         topics: 8  },
  { id: 'mlops',         label: 'MLOps',           icon: '⚙️',  path: 'pages/mlops.html',          topics: 9  },
];

function getBasePath() {
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  if (window.location.pathname.includes('/pages/')) return '../';
  return './';
}

function getCurrentModule() {
  const path = window.location.pathname;
  for (const mod of NAV_MODULES) {
    if (path.includes(mod.id)) return mod.id;
  }
  return null;
}

function getModuleProgress(moduleId) {
  const data = JSON.parse(localStorage.getItem('ai_eng_progress') || '{}');
  return data[moduleId] || { completed: 0, total: 0 };
}

function buildSidebar() {
  const base = getBasePath();
  const current = getCurrentModule();

  const html = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <a href="${base}index.html">
          <div class="logo-icon">⚡</div>
          <div class="logo-text">AI Engineer<span>Learning Path</span></div>
        </a>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Modules</div>
        ${NAV_MODULES.map(m => {
          const prog = getModuleProgress(m.id);
          const done = prog.completed || 0;
          const total = prog.total || m.topics;
          const isActive = m.id === current;
          return `
            <a href="${base}${m.path}"
               class="nav-link ${isActive ? 'active' : ''}"
               data-module="${m.id}">
              <span class="nav-link-icon">${m.icon}</span>
              <span>${m.label}</span>
              <span class="nav-link-num">${done}/${total}</span>
            </a>
          `;
        }).join('')}
      </nav>
      <div class="sidebar-footer">
        <a href="${base}index.html" class="back-home-btn">
          <span>🏠</span>
          <span>Back to Home</span>
        </a>
      </div>
    </aside>
  `;
  return html;
}

function buildBottomNav() {
  const base = getBasePath();
  const current = getCurrentModule();
  const isHome = !current;

  const homeLink = `
    <a href="${base}index.html" class="bottom-nav-link ${isHome ? 'active' : ''}">
      <span class="icon">🏠</span>
      <span>Home</span>
    </a>
  `;

  const moduleLinks = NAV_MODULES.map(m => `
    <a href="${base}${m.path}"
       class="bottom-nav-link ${m.id === current ? 'active' : ''}">
      <span class="icon">${m.icon}</span>
      <span>${m.label.split(' ')[0]}</span>
    </a>
  `).join('');

  return `
    <nav class="bottom-nav" id="bottom-nav">
      <div class="bottom-nav-inner">
        ${homeLink}
        ${moduleLinks}
      </div>
    </nav>
  `;
}

function injectNav() {
  const layout = document.querySelector('.app-layout');
  if (!layout) return;

  layout.insertAdjacentHTML('afterbegin', buildSidebar());

  const body = document.body;
  body.insertAdjacentHTML('beforeend', buildBottomNav());
}

function markTopicComplete(moduleId, topicId) {
  const data = JSON.parse(localStorage.getItem('ai_eng_progress') || '{}');
  if (!data[moduleId]) data[moduleId] = { completed: 0, total: 0, topics: {} };
  if (!data[moduleId].topics) data[moduleId].topics = {};

  const wasComplete = !!data[moduleId].topics[topicId];

  if (!wasComplete) {
    data[moduleId].topics[topicId] = true;
    data[moduleId].completed = Object.values(data[moduleId].topics).filter(Boolean).length;
  } else {
    data[moduleId].topics[topicId] = false;
    data[moduleId].completed = Object.values(data[moduleId].topics).filter(Boolean).length;
  }

  localStorage.setItem('ai_eng_progress', JSON.stringify(data));
  updateNavCounts();
  return !wasComplete;
}

function updateNavCounts() {
  NAV_MODULES.forEach(m => {
    const prog = getModuleProgress(m.id);
    const count = document.querySelector(`.nav-link[data-module="${m.id}"] .nav-link-num`);
    if (count) {
      const total = prog.total || m.topics;
      count.textContent = `${prog.completed || 0}/${total}`;
    }
  });
}

function getOverallProgress() {
  let totalTopics = 0;
  let completedTopics = 0;
  const data = JSON.parse(localStorage.getItem('ai_eng_progress') || '{}');
  NAV_MODULES.forEach(m => {
    totalTopics += m.topics;
    const prog = data[m.id];
    if (prog) completedTopics += prog.completed || 0;
  });
  return { total: totalTopics, completed: completedTopics, pct: totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0 };
}

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
});
