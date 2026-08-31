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
    ...Array.from({ length: 8 }, (_, index) => `pages/0${index + 1}-${[
      'foundations', 'ml-core', 'deep-learning', 'transformers-llms',
      'rag-vectordb', 'agents-langchain', 'inference-optimization', 'mlops-production'
    ][index]}.html`),
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
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/, pagePath);
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

  assert.equal(modules.length, 8);
  for (const module of modules) {
    await access(new URL(module.path, root));
    const page = await read(module.path);
    const topicIds = [...page.matchAll(/data-topic-id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(topicIds.length, module.topics, `${module.slug} topic count`);
    assert.equal(new Set(topicIds).size, topicIds.length, `${module.slug} topic IDs must be unique`);
  }

  assert.equal(modules.reduce((sum, module) => sum + module.topics, 0), 70);
});
