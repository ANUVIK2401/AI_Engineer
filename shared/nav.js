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

const MODULE_LEARNING_GUIDES = {
  'foundations': {
    promise: 'Turn AI vocabulary into first-principles mental models.',
    checkpoints: ['Explain the AI -> ML -> DL -> GenAI hierarchy without buzzwords.', 'Connect vectors, probability, and gradients to how models actually learn.', 'Spot when a weak answer is memorized instead of reasoned.'],
    blindspots: ['People memorize definitions but cannot compare them.', 'Math ideas feel abstract until you tie them to model behavior.', 'Interview answers get vague when you skip the underlying mechanism.'],
    studyMove: 'Read one card, redraw the visual from memory, then say the answer out loud in plain English.'
  },
  'ml-core': {
    promise: 'Build intuition for classical ML choices and evaluation tradeoffs.',
    checkpoints: ['Choose the right model family for a problem shape.', 'Explain metrics in terms of business cost, not just formulas.', 'Describe when data quality beats model complexity.'],
    blindspots: ['People talk algorithms without naming assumptions.', 'Accuracy gets overused on imbalanced problems.', 'Model selection answers often ignore data leakage.'],
    studyMove: 'For each method, ask: what assumption makes this work, and what breaks when that assumption fails?'
  },
  'deep-learning': {
    promise: 'See neural networks as trainable systems rather than black boxes.',
    checkpoints: ['Describe forward pass, backprop, activations, and normalization cleanly.', 'Explain how regularization changes generalization.', 'Compare older architectures to what transformers replaced.'],
    blindspots: ['Backprop gets memorized as steps instead of gradient flow.', 'Regularization is described as magic instead of bias-variance tradeoff.', 'Architecture comparisons often skip why one scales better.'],
    studyMove: 'After each card, finish the sentence: this helps because otherwise the model would...'
  },
  'transformers-llms': {
    promise: 'Make attention, tokenization, and alignment feel mechanically obvious.',
    checkpoints: ['Walk through a transformer block in order.', 'Explain why tokenization and decoding change behavior.', 'Connect RLHF, LoRA, and sampling to the base next-token objective.'],
    blindspots: ['Attention answers stay hand-wavy without Q/K/V roles.', 'People confuse training objective with inference strategy.', 'Alignment terms blur together without a before/after framing.'],
    studyMove: 'Use the visuals first, then narrate the flow from tokens to logits without looking back.'
  },
  'rag-vectordb': {
    promise: 'Reason about retrieval quality, failure modes, and measurement.',
    checkpoints: ['Explain the full RAG pipeline as a chain of tradeoffs.', 'Compare embeddings, hybrid retrieval, reranking, and chunking.', 'Name how to tell whether retrieval or generation is failing.'],
    blindspots: ['People treat retrieval as solved once search returns something.', 'Chunking gets discussed without the downstream recall tradeoff.', 'Evaluation answers often ignore groundedness and citation quality.'],
    studyMove: 'For every component, ask what signal it improves and what new failure mode it introduces.'
  },
  'agents-langchain': {
    promise: 'Understand agent loops as controllable systems, not autonomous magic.',
    checkpoints: ['Describe the plan -> act -> observe loop clearly.', 'Explain memory, tools, and guardrails as separate concerns.', 'Spot loop, tool, and safety failures before they escalate.'],
    blindspots: ['Tool calling gets confused with true planning.', 'Memory is added without deciding what should persist.', 'Safety answers stop at prompts instead of controls and policy.'],
    studyMove: 'When you finish a topic, answer: what makes the agent stop, and what keeps it safe before that?'
  },
  'inference-optimization': {
    promise: 'Think in latency, throughput, memory, and cost at the same time.',
    checkpoints: ['Explain why serving bottlenecks shift with workload shape.', 'Compare quantization, batching, and KV cache strategies.', 'Connect infrastructure choices to user-facing speed and cost.'],
    blindspots: ['People know terms like vLLM but not when to use them.', 'Optimization answers skip memory bandwidth constraints.', 'Tradeoffs are incomplete when quality impact is ignored.'],
    studyMove: 'Translate every optimization into a sentence that starts with: this is worth it when...'
  },
  'mlops-production': {
    promise: 'Turn model delivery into an end-to-end operating discipline.',
    checkpoints: ['Describe the ML lifecycle from experiment to monitoring.', 'Explain drift, evaluation, rollback, and observability clearly.', 'Talk about production systems in terms of reliability loops.'],
    blindspots: ['Deployment answers often stop at shipping, not monitoring.', 'Drift gets mentioned without detection strategy.', 'Evaluation and release controls are often treated as optional polish.'],
    studyMove: 'End each topic by naming what you would monitor, alert on, and change next.'
  }
};

const PROGRESS_KEY = 'ai_eng_progress_v2';
const FOCUS_MODE_KEY = 'ai_eng_focus_mode_v1';

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
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {}
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
  if (document.body.classList.contains('home-page')) return;
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  shell.insertAdjacentHTML('afterbegin', buildSidebar());
  document.body.insertAdjacentHTML('beforeend', buildBottomNav());
}

function stripText(value) {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortenText(value, wordLimit = 18) {
  const words = stripText(value).split(' ').filter(Boolean);
  if (words.length <= wordLimit) return words.join(' ');
  return `${words.slice(0, wordLimit).join(' ')}...`;
}

function firstSentence(value) {
  const clean = stripText(value);
  const match = clean.match(/.+?[.!?](?=\s|$)/);
  return match ? match[0].trim() : clean;
}

function injectModuleSnapshot() {
  const slug = getCurrentModuleSlug();
  const header = document.querySelector('.module-header');
  const guide = slug ? MODULE_LEARNING_GUIDES[slug] : null;
  if (!slug || !header || !guide || document.querySelector('.module-snapshot')) return;

  header.insertAdjacentHTML('afterend', `
    <section class="module-snapshot" aria-label="Module study guide">
      <article class="snapshot-card snapshot-primary">
        <span class="snapshot-kicker">What this module gives you</span>
        <h2>${guide.promise}</h2>
      </article>
      <details class="snapshot-details">
        <summary>
          <span><span class="snapshot-kicker">Before you start</span><strong>Goals, common misses, and the fastest study move</strong></span>
          <span class="snapshot-open-label">Open guide <span aria-hidden="true">＋</span></span>
        </summary>
        <div class="snapshot-detail-grid">
          <div><h3>You should be able to</h3><ul>${guide.checkpoints.map(item => `<li>${item}</li>`).join('')}</ul></div>
          <div><h3>Common misses</h3><ul>${guide.blindspots.map(item => `<li>${item}</li>`).join('')}</ul></div>
          <div><h3>Fastest study move</h3><p>${guide.studyMove}</p></div>
        </div>
      </details>
    </section>`);
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
      const setLabel = () => dot.setAttribute('aria-label',
        `${card.classList.contains('is-read') ? 'Mark as unread' : 'Mark as read'}: ${card.querySelector('h3')?.textContent || 'topic'}`);
      setTitle();
      setLabel();
      const toggle = () => {
        const nowRead = toggleTopicRead(slug, topicId);
        card.classList.toggle('is-read', nowRead);
        setTitle();
        setLabel();
        updateModuleProgressUI();
        updateStudyNavigator();
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
  document.querySelectorAll('.interview-toggle').forEach((toggle, index) => {
    const content = toggle.nextElementSibling;
    const contentId = `interview-answer-${index + 1}`;
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', contentId);
    if (content) content.id = contentId;

    const changeState = () => {
      const open = toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      if (content) content.classList.toggle('open', open);
    };

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      changeState();
    });
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        changeState();
      }
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
      btn.setAttribute('aria-expanded', String(open));
      answer.setAttribute('aria-hidden', String(!open));
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

/* ── Human-centered learning layer ─────────────────────── */

function enhanceLearningCards() {
  const cards = [...document.querySelectorAll('.card[data-topic-id]')];
  if (!cards.length) return;

  cards.forEach((card, index) => {
    const heading = card.querySelector('.card-header-left h3');
    if (heading && !card.querySelector('.topic-sequence')) {
      heading.insertAdjacentHTML('beforebegin', `<span class="topic-sequence">${String(index + 1).padStart(2, '0')}</span>`);
    }

    const points = [...card.querySelectorAll('.card-core > ul > li')];
    const cues = ['What it is', 'Why it matters'];
    points.slice(0, 2).forEach((point, pointIndex) => {
      if (!point.querySelector('.learning-cue')) {
        point.insertAdjacentHTML('afterbegin', `<span class="learning-cue">${cues[pointIndex]}</span>`);
      }
    });

    const insight = points.find(point => point.classList.contains('insight'));
    const insightLead = insight?.querySelector('strong');
    if (insightLead) {
      insightLead.classList.add('learning-cue');
      insightLead.textContent = 'Remember this';
    }

    if (!card.querySelector('.card-summary-bar')) {
      const recallPrompt = stripText(card.querySelector('.interview-q')?.textContent || '');
      const firstPoint = firstSentence(points[0]?.textContent || '');
      const secondPoint = firstSentence(points[1]?.textContent || '');
      const summaryItems = [
        { label: 'Core idea', value: shortenText(firstPoint, 16) },
        { label: 'Why it matters', value: shortenText(secondPoint, 16) },
        { label: 'Try saying this', value: shortenText(recallPrompt.replace(/^"|"$/g, ''), 14) }
      ].filter((item) => item.value);

      card.querySelector('.card-body')?.insertAdjacentHTML('afterbegin', `
        <div class="card-summary-bar" aria-label="Quick topic scan">
          ${summaryItems.map((item) => `
            <div class="card-summary-item">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
            </div>`).join('')}
        </div>`);
    }

    card.style.setProperty('--reveal-order', index);
    card.classList.add('reveal-ready');
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    cards.forEach(card => card.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px' });
  cards.forEach(card => observer.observe(card));
}

function updateStudyNavigator() {
  const slug = getCurrentModuleSlug();
  if (!slug) return;
  document.querySelectorAll('.study-topic').forEach(link => {
    const read = isTopicRead(slug, link.dataset.topicId);
    link.classList.toggle('is-read', read);
    link.setAttribute('aria-label', `${link.textContent.trim()}${read ? ', completed' : ''}`);
  });
}

function buildStudyNavigator() {
  const header = document.querySelector('.module-header');
  const cards = [...document.querySelectorAll('.card[data-topic-id]')];
  if (!header || !cards.length || document.querySelector('.study-navigator')) return;
  const anchor = document.querySelector('.module-snapshot') || header;

  const links = cards.map((card, index) => {
    const topicId = card.dataset.topicId;
    const label = card.querySelector('h3')?.textContent.trim() || `Topic ${index + 1}`;
    return `<a class="study-topic" data-topic-id="${topicId}" href="#${topicId}"><span>${String(index + 1).padStart(2, '0')}</span>${label}</a>`;
  }).join('');

  anchor.insertAdjacentHTML('afterend', `
    <nav class="study-navigator" aria-label="Topics in this module">
      <div class="study-nav-head">
        <div><span class="section-kicker">In this module</span><strong>Jump to a topic</strong></div>
        <button class="focus-toggle" type="button" aria-pressed="false"><span aria-hidden="true">◉</span> Focus mode</button>
      </div>
      <div class="study-topic-list">${links}</div>
    </nav>`);

  const focusButton = document.querySelector('.focus-toggle');
  const applyFocus = (active) => {
    document.body.classList.toggle('focus-mode', active);
    focusButton.setAttribute('aria-pressed', String(active));
    focusButton.lastChild.textContent = active ? ' Exit focus' : ' Focus mode';
  };
  let savedFocus = false;
  try { savedFocus = localStorage.getItem(FOCUS_MODE_KEY) === 'true'; } catch {}
  applyFocus(savedFocus);
  focusButton.addEventListener('click', () => {
    const next = !document.body.classList.contains('focus-mode');
    try { localStorage.setItem(FOCUS_MODE_KEY, String(next)); } catch {}
    applyFocus(next);
  });

  updateStudyNavigator();
}

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  initTopicCards();
  injectModuleSnapshot();
  enhanceLearningCards();
  buildStudyNavigator();
  initInterviewToggles();
  initSimulator();
  scrollToHashCard();
});
