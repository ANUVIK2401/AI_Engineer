import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('home page prioritizes a guided learning path and practice', async () => {
  const html = await read('index.html');

  assert.match(html, /id="continue-learning"/);
  assert.match(html, /class="learning-path"/);
  assert.match(html, /id="module-grid"/);
  assert.match(html, /id="quickfire-container"/);
  assert.match(html, /<details class="knowledge-map-panel"/);
});

test('home page owns the full viewport without module navigation collisions', async () => {
  const html = await read('index.html');
  const nav = await read('shared/nav.js');
  const css = await read('shared/styles.css');

  assert.match(nav, /document\.body\.classList\.contains\('home-page'\)/);
  assert.match(css, /\.home-page \.sidebar/);
  assert.doesNotMatch(html, /class="daily-plan"/);
  assert.doesNotMatch(html, /class="proof-grid"/);
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
