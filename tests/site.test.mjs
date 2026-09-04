import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('home page prioritizes modules, a compact learning loop, and practice', async () => {
  const html = await read('index.html');

  assert.match(html, /id="continue-learning"/);
  assert.match(html, /class="hero-study-loop"/);
  assert.match(html, /class="topbar-mode-nav"/);
  assert.match(html, /function initHomeSectionNav\(/);
  assert.match(html, /aria-current="location">Map/);
  assert.match(html, /id="module-grid"/);
  assert.match(html, /id="quickfire-container"/);
  assert.match(html, /<details class="knowledge-map-panel"/);
  assert.match(html, /id="knowledge-map-preview"/);
  assert.match(html, /function renderKnowledgeMapPreview\(/);
  assert.ok(html.indexOf('id="knowledge-map"') < html.indexOf('class="home-hero"'));
  assert.doesNotMatch(html, /class="learning-path"/);
});

test('home page keeps the shared desktop sidebar in its own layout column', async () => {
  const nav = await read('shared/nav.js');
  const css = await read('shared/styles.css');

  assert.doesNotMatch(nav, /if \(document\.body\.classList\.contains\('home-page'\)\) return/);
  assert.match(nav, /class="sidebar-overview\$\{homeActive \? ' active' : ''\}"/);
  assert.match(nav, /class="sidebar-practice"/);
  assert.match(css, /\.home-page \.app-shell \{ display: flex; \}/);
  assert.match(css, /\.home-page \.main-inner/);
});

test('dark learning palette gives navigation, actions, and progress distinct roles', async () => {
  const css = await read('shared/styles.css');

  assert.match(css, /--black:/);
  assert.match(css, /--deep-red:/);
  assert.match(css, /--deep-blue:/);
  assert.match(css, /--deep-green:/);
});

test('mobile navigation exposes meaningful destinations and current page state', async () => {
  const nav = await read('shared/nav.js');

  assert.match(nav, /aria-label="Open \$\{m\.label\} module"/);
  assert.match(nav, /m\.slug === current \? ' aria-current="page"' : ''/);
  assert.match(nav, /homeActive \? ' aria-current="page"' : ''/);
});

test('tablet layouts switch to a full-width reading surface before content becomes cramped', async () => {
  const css = await read('shared/styles.css');

  assert.match(css, /@media \(max-width: 899px\)/);
  assert.match(css, /\.main > :not\(\.main-inner\)/);
  assert.match(css, /\.qa-mobile-nav/);
  assert.match(css, /min-height: 44px/);
});

test('interview pages keep navigation available when the desktop sidebar collapses', async () => {
  const qa = await read('shared/qa.js');

  assert.match(qa, /function buildQAMobileNav\(/);
  assert.match(qa, /class="qa-mobile-nav"/);
  assert.match(qa, /aria-current="page"/);
  assert.match(qa, /role', 'main'/);
});

test('every page shares one responsive stylesheet version and a viewport contract', async () => {
  const pagePaths = [
    'index.html',
    'interview.html',
    ...[
      '01-foundations', '02-ml-core', '03-deep-learning', '04-transformers-llms',
      '05-rag-vectordb', '06-agents-langchain', '07-inference-optimization', '08-mlops-production',
      '09-classical-nlp', '10-unsupervised-ml', '11-generative-vision', '12-training-scale'
    ].map(name => `pages/${name}.html`),
    ...[
      '01-llm-fundamentals', '02-prompt-engineering', '03-rag', '04-vector-db',
      '05-agents', '06-fine-tuning', '07-system-design', '08-llmops',
      '09-evaluation', '10-safety-ethics', '11-multimodal', '12-infrastructure',
      '13-coding', '14-behavioral'
    ].map(name => `pages/interview/${name}.html`),
  ];
  const versions = new Set();

  for (const pagePath of pagePaths) {
    const html = await read(pagePath);
    // viewport-fit=cover is required or env(safe-area-inset-*) resolves to 0
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0, viewport-fit=cover">/, pagePath);
    const version = html.match(/shared\/styles\.css\?v=([^"']+)/)?.[1];
    assert.ok(version, `${pagePath} must load the shared stylesheet`);
    versions.add(version);
  }

  assert.equal(versions.size, 1);
});

test('shared module experience includes scan, summary, and focus helpers', async () => {
  const nav = await read('shared/nav.js');

  assert.match(nav, /const MODULE_LEARNING_GUIDES =/);
  assert.match(nav, /function injectModuleSnapshot\(/);
  assert.match(nav, /class="snapshot-details"/);
  assert.match(nav, /function enhanceLearningCards\(/);
  assert.match(nav, /function buildStudyNavigator\(/);
  assert.match(nav, /prefers-reduced-motion/);
  assert.match(nav, /aria-expanded/);
});

test('interview answers and landing page content render as scannable study points', async () => {
  const qa = await read('shared/qa.js');
  const interviewHub = await read('interview.html');

  assert.match(qa, /function formatQAAnswer\(/);
  assert.match(qa, /qa-answer-point/);
  assert.match(qa, /function buildAnswerTakeaway\(/);
  assert.match(interviewHub, /class="qa-start-grid"/);
  assert.match(interviewHub, /class="qa-playbook"/);
});

test('interview answer reveals keep visual and assistive states in sync', async () => {
  const qa = await read('shared/qa.js');

  assert.match(qa, /class="qa-a" id="answer-\$\{section\.slug\}-\$\{i \+ 1\}" aria-hidden="true"/);
  assert.match(qa, /answer\.setAttribute\('aria-hidden', String\(!open\)\)/);
  assert.match(qa, /answer\?\.setAttribute\('aria-hidden', 'false'\)/);
});

test('motion, cards, and focus treatments respect accessibility preferences', async () => {
  const css = await read('shared/styles.css');

  assert.match(css, /\.study-navigator/);
  assert.match(css, /\.module-snapshot/);
  assert.match(css, /\.learning-cue/);
  assert.match(css, /\.qa-playbook/);
  assert.match(css, /\.answer-takeaway/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
});

test('quick-fire reveals expose complete accessible state', async () => {
  const html = await read('index.html');
  const nav = await read('shared/nav.js');

  assert.match(html, /aria-controls="quick-answer-\$\{i \+ 1\}"/);
  assert.match(html, /id="quick-answer-\$\{i \+ 1\}" aria-hidden="true"/);
  assert.match(nav, /btn\.setAttribute\('aria-expanded', String\(open\)\)/);
  assert.match(nav, /answer\.setAttribute\('aria-hidden', String\(!open\)\)/);
});

test('module metadata stays consistent with every learning page', async () => {
  const nav = await read('shared/nav.js');
  const modulePattern = /slug:\s*'([^']+)'[^\n]+path:\s*'([^']+)'[^\n]+topics:\s*(\d+)/g;
  const modules = [...nav.matchAll(modulePattern)].map(([, slug, path, topics]) => ({ slug, path, topics: Number(topics) }));

  assert.equal(modules.length, 12);
  for (const module of modules) {
    await access(new URL(module.path, root));
    const page = await read(module.path);
    const topicIds = [...page.matchAll(/data-topic-id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(topicIds.length, module.topics, `${module.slug} topic count`);
    assert.equal(new Set(topicIds).size, topicIds.length, `${module.slug} topic IDs must be unique`);
  }

  assert.equal(modules.reduce((sum, module) => sum + module.topics, 0), 104);
});

test('every module card exposes the recall prompt the recall layer depends on', async () => {
  const nav = await read('shared/nav.js');
  const modulePaths = [...nav.matchAll(/path:\s*'(pages\/[^']+)'/g)].map(m => m[1]);
  assert.equal(modulePaths.length, 12);

  for (const path of modulePaths) {
    const page = await read(path);
    const cardCount = [...page.matchAll(/data-topic-id="/g)].length;
    // enhanceLearningCards() builds .card-recall from .interview-q; a card
    // without one silently renders with no recall prompt.
    const questionCount = [...page.matchAll(/class="interview-q"/g)].length;
    assert.equal(questionCount, cardCount, `${path}: every topic card needs an .interview-q`);

    // the recall reveal gates .card-core, so a card missing it would show nothing
    const coreCount = [...page.matchAll(/class="card-core"/g)].length;
    assert.equal(coreCount, cardCount, `${path}: every topic card needs a .card-core`);
  }
});

test('recall-first reveal, topic filter, and keyboard stepping are wired up', async () => {
  const nav = await read('shared/nav.js');
  const css = await read('shared/styles.css');

  assert.match(nav, /function initRecallToggles\(/);
  assert.match(nav, /function initTopicFilter\(/);
  assert.match(nav, /function initCardKeyboardNav\(/);
  // outside recall mode nothing hides; inside it, read topics still open
  assert.match(nav, /setState\(!document\.body\.classList\.contains\('recall-mode'\) \|\| card\.classList\.contains\('is-read'\)\)/);
  assert.match(nav, /id="topic-filter"/);
  assert.match(nav, /aria-live="polite"/);
  // all three initializers must actually run on load
  for (const fn of ['initRecallToggles', 'initTopicFilter', 'initCardKeyboardNav']) {
    assert.match(nav, new RegExp(`\\n  ${fn}\\(\\);`), `${fn} must run on DOMContentLoaded`);
  }

  assert.match(css, /\.card-recall \{/);
  // blur must be gated behind recall mode: plain reading is never obscured
  assert.match(css, /\.recall-mode \.card:not\(\.is-revealed\) \.card-core/);
  assert.doesNotMatch(css, /\n\.card:not\(\.is-revealed\) \.card-core/);
  assert.match(css, /\.card\.is-revealed \.card-core/);
  assert.match(css, /\.recall-toggle\[aria-pressed="true"\]/);
  assert.match(nav, /function applyRecall|const applyRecall/);
  assert.match(nav, /RECALL_MODE_KEY/);
  assert.match(css, /\.study-filter input/);
  assert.match(css, /\.sr-only \{/);
  // printing must never hand the reader a page of blurred boxes
  assert.match(css, /@media print \{[\s\S]*?is-revealed\) \.card-core/);
});

test('sidebar scrolls its module list, not the whole rail', async () => {
  const css = await read('shared/styles.css');

  // 12 modules overflow a ~950px sidebar, so the rail must not scroll as one
  // block — that hides the pinned mastery/practice footer and clips the list.
  const sidebarRule = css.match(/\n\.sidebar \{[\s\S]*?\n\}/)?.[0];
  assert.ok(sidebarRule, '.sidebar rule must exist');
  assert.match(sidebarRule, /overflow:\s*hidden/);
  assert.doesNotMatch(sidebarRule, /overflow-y:\s*auto/);

  const navRule = css.match(/\n\.sidebar-nav \{[\s\S]*?\n\}/)?.[0];
  assert.ok(navRule, '.sidebar-nav rule must exist');
  assert.match(navRule, /overflow-y:\s*auto/);
  // without min-height:0 a flex child refuses to shrink below content height
  // and scrolls nothing, which is the silent way this fix regresses
  assert.match(navRule, /min-height:\s*0/);
  assert.match(navRule, /flex:\s*1 1 auto/);

  // chrome above and below the list must not be squeezed by 12 rows
  for (const selector of ['.sidebar-top', '.sidebar-overview', '.sidebar-section-label', '.sidebar-footer']) {
    const rule = css.match(new RegExp(`\\n\\${selector} \\{[\\s\\S]*?\\n?\\}`))?.[0];
    assert.ok(rule, `${selector} rule must exist`);
    assert.match(rule, /flex-shrink:\s*0/, `${selector} must not shrink`);
  }
});

test('every topic card carries a diagram', async () => {
  const nav = await read('shared/nav.js');
  const modulePaths = [...nav.matchAll(/path:\s*'(pages\/[^']+)'/g)].map(m => m[1]);

  let cards = 0;
  for (const path of modulePaths) {
    const page = await read(path);
    for (const card of page.split(/(?=<div class="card" data-topic-id=)/).slice(1)) {
      const id = card.match(/data-topic-id="([^"]+)"/)[1];
      cards += 1;
      assert.ok(card.includes('<svg'), `${path}#${id} has no diagram`);
      // a diagram nobody can describe is decoration, not a learning aid
      assert.match(card, /<svg[^>]*role="img"[^>]*aria-label|aria-label[^>]*>/,
        `${path}#${id} diagram needs an aria-label`);
    }
  }
  assert.equal(cards, 104);
});

test('iPad and MacBook fit rules are present', async () => {
  const css = await read('shared/styles.css');

  // iOS vh excludes the dynamic toolbar, which pushed the pinned sidebar
  // footer below the fold — dvh tracks the visible height instead
  assert.match(css, /height: 100dvh/);
  assert.match(css, /min-height: 100dvh/);
  assert.match(css, /@supports \(padding: env\(safe-area-inset-left\)\)/);
  // iPad portrait keeps the rail but narrows it
  assert.match(css, /@media \(min-width: 744px\) and \(max-width: 1023px\) and \(orientation: portrait\)/);
  // short landscape tablets must not stack three sticky bars
  assert.match(css, /@media \(max-height: 850px\) and \(orientation: landscape\)/);
  // touch devices need a pressed state, not a stuck :hover
  assert.match(css, /@media \(hover: none\)/);
});
