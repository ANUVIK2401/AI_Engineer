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
  { id: '09', slug: 'classical-nlp',         label: 'Classical NLP',           path: 'pages/09-classical-nlp.html',          topics: 9  },
  { id: '10', slug: 'unsupervised-ml',       label: 'Unsupervised & Applied ML', path: 'pages/10-unsupervised-ml.html',      topics: 9  },
  { id: '11', slug: 'generative-vision',     label: 'Generative & Vision',     path: 'pages/11-generative-vision.html',      topics: 8  },
  { id: '12', slug: 'training-scale',        label: 'Training & Scale',        path: 'pages/12-training-scale.html',         topics: 8  },
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
  'classical-nlp': {
    promise: 'Understand what transformers replaced, and why the old tools survive.',
    checkpoints: ['Explain why BM25 still beats embeddings on exact matches.', 'Trace the path from n-grams through seq2seq to attention.', 'Name the right metric for each NLP task shape.'],
    blindspots: ['People skip pre-transformer NLP and cannot explain what problem attention solved.', 'BLEU and ROUGE get quoted without knowing what they fail to measure.', 'Static versus contextual embeddings get blurred together.'],
    studyMove: 'For each classical method, name the exact limitation that motivated its replacement.'
  },
  'unsupervised-ml': {
    promise: 'Handle the majority of real ML work: no labels, imbalanced data, tabular features.',
    checkpoints: ['Choose a clustering method from the shape of the data.', 'Spot leakage in a feature pipeline before it ships.', 'Set a decision threshold from cost, not from 0.5.'],
    blindspots: ['Cluster counts get picked by elbow plot instead of by decision.', 'Target encoding leaks and nobody notices until production.', 'SHAP gets presented to stakeholders as if it were causal.'],
    studyMove: 'For each technique, ask what silently breaks and whether any metric would tell you.'
  },
  'generative-vision': {
    promise: 'See every generative family as a different answer to one modeling question.',
    checkpoints: ['Place VAEs, GANs, diffusion, and autoregressive models on the trilemma.', 'Explain why latent diffusion works and where its ceiling is.', 'Predict where CLIP and VLMs break from their training objective.'],
    blindspots: ['Generative AI gets treated as synonymous with LLMs.', 'Diffusion is described as newer rather than more trainable.', 'Inductive bias is skipped when comparing CNNs and ViTs.'],
    studyMove: 'For each model, name the training objective, then predict a failure it must have.'
  },
  'training-scale': {
    promise: 'Reason about the memory, precision, and data decisions that make a run work.',
    checkpoints: ['Compute a training memory budget from parameters up.', 'Explain warmup, bf16, and clipping as fixes for specific failures.', 'Pick a parallelism strategy from the interconnect.'],
    blindspots: ['Model size gets equated with memory, ignoring optimizer state.', 'NaN losses get fixed by lowering the LR without diagnosing why.', 'Scaling laws get quoted without separating training from inference cost.'],
    studyMove: 'For every failure symptom, name the single number you would log to confirm it.'
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
const RECALL_MODE_KEY = 'ai_eng_recall_mode_v1';

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
  const homeActive = document.body.classList.contains('home-page');
  const overall = getOverallProgress();

  const links = NAV_MODULES.map(m => {
    const done = getModuleCompletedCount(m.slug);
    const pct = Math.round((done / m.topics) * 100);
    const isActive = m.slug === current;
    return `
      <li>
        <a href="${base}${m.path}" class="${isActive ? 'active' : ''}"${isActive ? ' aria-current="page"' : ''}>
          <span class="nav-num">${m.id}</span>
          <span class="nav-label">${m.label}</span>
        </a>
        <div class="sidebar-progress-mini"><div style="width:${pct}%"></div></div>
      </li>
    `;
  }).join('');

  return `
    <nav class="sidebar" id="sidebar" aria-label="Learning navigation">
      <div class="sidebar-top">
        <a href="${base}index.html" class="sidebar-brand">AI Eng <span>Prep</span></a>
        <span class="sidebar-status"><i></i> Learning workspace</span>
      </div>
      <a href="${base}index.html" class="sidebar-overview${homeActive ? ' active' : ''}"${homeActive ? ' aria-current="page"' : ''}>
        <span class="nav-icon" aria-hidden="true">⌂</span>
        <span><strong>Overview</strong><small>Your learning dashboard</small></span>
      </a>
      <div class="sidebar-section-label"><span>Curriculum</span><span>12 modules</span></div>
      <ul class="sidebar-nav">${links}</ul>
      <div class="sidebar-footer">
        <div class="sidebar-overall">
          <span><strong>${overall.pct}%</strong> overall mastery</span>
          <span>${overall.completed}/${overall.total}</span>
          <div><i style="width:${overall.pct}%"></i></div>
        </div>
        <a class="sidebar-practice" href="${base}interview.html">
          <span>Practice bank</span>
          <strong>487 questions <span aria-hidden="true">↗</span></strong>
        </a>
      </div>
    </nav>
  `;
}

function buildBottomNav() {
  const base = getBasePath();
  const current = getCurrentModuleSlug();
  const homeActive = !current;

  const links = NAV_MODULES.map(m => `
    <a href="${base}${m.path}" class="${m.slug === current ? 'active' : ''}"
       aria-label="Open ${m.label} module"${m.slug === current ? ' aria-current="page"' : ''}>${m.id}</a>
  `).join('');

  return `
    <nav class="bottom-nav" id="bottom-nav">
      <a href="${base}index.html" class="${homeActive ? 'active' : ''}" aria-label="Open learning overview"${homeActive ? ' aria-current="page"' : ''}>HOME</a>
      ${links}
    </nav>
  `;
}

function injectNav() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  const main = shell.querySelector('.main');
  if (main) {
    main.id = main.id || 'main-content';
    main.setAttribute('role', 'main');
  }
  if (!document.querySelector('.skip-link')) {
    document.body.insertAdjacentHTML('afterbegin', '<a class="skip-link" href="#main-content">Skip to main content</a>');
  }
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
      const recallPrompt = stripText(card.querySelector('.interview-q')?.textContent || '').replace(/^"|"$/g, '');
      const firstPoint = firstSentence(points[0]?.textContent || '');
      const secondPoint = firstSentence(points[1]?.textContent || '');
      const summaryItems = [
        { label: 'Core idea', value: shortenText(firstPoint, 16) },
        { label: 'Why it matters', value: shortenText(secondPoint, 16) }
      ].filter((item) => item.value);

      const scanStrip = summaryItems.length ? `
        <div class="card-summary-bar" aria-label="Quick topic scan">
          ${summaryItems.map((item) => `
            <div class="card-summary-item">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
            </div>`).join('')}
        </div>` : '';

      // Recall before reading: the prompt sits above the explanation so the
      // page asks the question first and the answer is a deliberate reveal.
      const recallBlock = recallPrompt ? `
        <div class="card-recall" data-recall-state="hidden">
          <div class="card-recall-head">
            <span class="card-recall-kicker">Answer this first</span>
            <button class="card-recall-toggle" type="button" aria-expanded="false">Reveal the explanation</button>
          </div>
          <p class="card-recall-q">${recallPrompt}</p>
        </div>` : '';

      card.querySelector('.card-body')?.insertAdjacentHTML('afterbegin', recallBlock + scanStrip);
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
        <div class="study-nav-actions">
          <button class="recall-toggle" type="button" aria-pressed="false"><span aria-hidden="true">◈</span> Recall mode</button>
          <button class="focus-toggle" type="button" aria-pressed="false"><span aria-hidden="true">◉</span> Focus mode</button>
        </div>
      </div>
      <div class="study-filter-row">
        <label class="study-filter">
          <span class="sr-only">Filter topics in this module</span>
          <input id="topic-filter" type="search" placeholder="Filter topics…  (press / )" autocomplete="off">
        </label>
        <p class="study-filter-status" id="topic-filter-status" role="status" aria-live="polite"></p>
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

  // Recall mode is opt-in: default reading shows everything, and turning it on
  // re-hides only the topics you have not marked read yet.
  const recallButton = document.querySelector('.recall-toggle');
  const applyRecall = (active) => {
    document.body.classList.toggle('recall-mode', active);
    recallButton.setAttribute('aria-pressed', String(active));
    recallButton.lastChild.textContent = active ? ' Exit recall' : ' Recall mode';
    document.querySelectorAll('.card[data-topic-id]').forEach(card => {
      const revealed = !active || card.classList.contains('is-read');
      card.classList.toggle('is-revealed', revealed);
      const toggle = card.querySelector('.card-recall-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(revealed));
        toggle.textContent = revealed ? 'Hide the explanation' : 'Reveal the explanation';
      }
    });
  };
  let savedRecall = false;
  try { savedRecall = localStorage.getItem(RECALL_MODE_KEY) === 'true'; } catch {}
  applyRecall(savedRecall);
  recallButton.addEventListener('click', () => {
    const next = !document.body.classList.contains('recall-mode');
    try { localStorage.setItem(RECALL_MODE_KEY, String(next)); } catch {}
    applyRecall(next);
  });

  updateStudyNavigator();
}

/* ── Recall-first card reveal ────────────────────────────── */

function initRecallToggles() {
  document.querySelectorAll('.card-recall-toggle').forEach(button => {
    const card = button.closest('.card');
    if (!card) return;
    const setState = (revealed) => {
      card.classList.toggle('is-revealed', revealed);
      button.setAttribute('aria-expanded', String(revealed));
      button.textContent = revealed ? 'Hide the explanation' : 'Reveal the explanation';
    };
    // outside recall mode nothing is hidden; inside it, a topic already marked
    // read has nothing left to quiz, so it opens outright
    setState(!document.body.classList.contains('recall-mode') || card.classList.contains('is-read'));
    button.addEventListener('click', () => setState(!card.classList.contains('is-revealed')));
  });
}

/* ── Topic filter ────────────────────────────────────────── */

function initTopicFilter() {
  const input = document.getElementById('topic-filter');
  if (!input) return;
  const cards = [...document.querySelectorAll('.card[data-topic-id]')];
  const links = [...document.querySelectorAll('.study-topic')];
  const status = document.getElementById('topic-filter-status');

  // index once: heading + body text per card, so filtering is a cheap substring test
  const haystacks = new Map(cards.map(card => [card, stripText(card.textContent).toLowerCase()]));

  const apply = () => {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach(card => {
      const match = !query || haystacks.get(card).includes(query);
      card.hidden = !match;
      if (match) shown += 1;
    });
    links.forEach(link => {
      const card = cards.find(c => c.dataset.topicId === link.dataset.topicId);
      link.hidden = !!card && card.hidden;
    });
    if (status) {
      status.textContent = query
        ? `${shown} of ${cards.length} topics match "${input.value.trim()}"`
        : `${cards.length} topics in this module`;
    }
  };

  input.addEventListener('input', apply);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { input.value = ''; apply(); }
  });
  apply();
}

/* ── Keyboard topic stepping ─────────────────────────────── */

function initCardKeyboardNav() {
  const visibleCards = () => [...document.querySelectorAll('.card[data-topic-id]')].filter(card => !card.hidden);
  if (!visibleCards().length) return;

  const isTypingTarget = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  document.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key !== 'j' && key !== 'k' && key !== '/') return;

    if (key === '/') {
      const input = document.getElementById('topic-filter');
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
      return;
    }

    const cards = visibleCards();
    // "current" is the last card whose top has passed the sticky-header line
    const marker = window.scrollY + 100;
    let index = cards.findIndex(card => card.getBoundingClientRect().top + window.scrollY > marker);
    if (index === -1) index = cards.length;
    const target = key === 'j' ? cards[Math.min(index, cards.length - 1)] : cards[Math.max(index - 2, 0)];
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  initTopicCards();
  injectModuleSnapshot();
  enhanceLearningCards();
  buildStudyNavigator();
  initRecallToggles();
  initTopicFilter();
  initCardKeyboardNav();
  initInterviewToggles();
  initSimulator();
  scrollToHashCard();
});
