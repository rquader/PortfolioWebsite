import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, readdir, unlink, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const content = path.join(root, 'src/content/blog');
const prefix = 'codex-verification-' + Date.now();
const created = [];
const draftSecret = `${prefix}-PRIVATE-DRAFT-BODY`;
const upcomingSecret = `${prefix}-UNFINISHED-UPCOMING-BODY`;

async function fixture(name, value) {
  const file = path.join(content, `${prefix}-${name}.md`);
  await writeFile(file, value, { flag: 'wx' });
  created.push(file);
}

function build(base) {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PUBLIC_BASE_URL: base },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

async function allText(directory) {
  const chunks = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) chunks.push(await allText(file));
    else if (/\.(html|xml|json|js)$/.test(file)) chunks.push(await readFile(file, 'utf8'));
  }
  return chunks.join('\n');
}

try {
  await fixture('draft', `---\ntitle: Private draft\ndescription: ""\nstatus: draft\n---\n${draftSecret}\n`);
  await fixture('upcoming', `---\ntitle: Upcoming test\ndescription: Upcoming description\nstatus: coming-soon\n---\n${upcomingSecret}\n`);
  await mkdir(path.join(content, 'images'), { recursive: true });
  const image = path.join(content, 'images', `${prefix}.png`);
  await copyFile(path.join(root, 'src/content/projects/vroomview/images/vroomview_screenshot.png'), image, 1);
  created.push(image);
  await fixture('published', `---\ntitle: Published test\ndescription: A verified description\nstatus: published\npublishedAt: "2026-10-11"\ntags: [Testing]\n---\n## First section\n\nA **formatted** article.\n\n## Second section\n\n\`\`\`js\nconst sample = 42;\n\`\`\`\n\n![Example screenshot](./images/${prefix}.png)\n`);
  build('/portfolio-test/');
  const dist = path.join(root, 'dist');
  const output = await allText(dist);
  assert.ok(!output.includes(draftSecret), 'Private draft body leaked into build');
  assert.ok(!output.includes(`${prefix}-draft`), 'Private draft route leaked into build');
  assert.ok(!output.includes(upcomingSecret), 'Upcoming article body leaked into build');
  const article = await readFile(path.join(dist, `blog/${prefix}-published/index.html`), 'utf8');
  assert.ok(article.includes('<strong>formatted</strong>'), 'Markdown did not render');
  assert.ok(article.includes('href="#second-section"'), 'Article contents missing heading link');
  assert.ok(article.includes('href="/portfolio-test/blog/"'), 'Blog back link lost base path');
  assert.ok(article.includes('href="/portfolio-test/#on-the-work"'), 'Cross-page navigation lost base path');
  assert.ok(article.includes('href="/portfolio-test/Rafan_Quader_Resume.pdf"'), 'Resume link lost base path');
  assert.ok(article.includes('alt="Example screenshot"'), 'Markdown image missing');
  assert.ok(!article.includes(`src="./images/${prefix}`), 'Markdown image was not processed');
  const upcoming = await readFile(path.join(dist, `blog/${prefix}-upcoming/index.html`), 'utf8');
  assert.ok(upcoming.includes('to be written, keep posted'));
  console.log('Passed: draft privacy, upcoming-body privacy, published Markdown, table of contents, images, and base-aware navigation.');
} finally {
  for (const file of created.reverse()) await unlink(file);
  build('/');
}
