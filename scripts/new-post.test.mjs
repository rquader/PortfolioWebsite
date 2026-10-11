import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createDraftPost } from './new-post.mjs';

async function withTempDir(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'new-post-'));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('creates a draft Markdown file with frontmatter and a starter heading', async () => {
  await withTempDir(async (root) => {
    const outputDir = path.join(root, 'src', 'content', 'blog');
    const filePath = await createDraftPost({ title: 'A Useful Article', contentDir: outputDir });
    const contents = await readFile(filePath, 'utf8');

    assert.equal(path.basename(filePath), 'a-useful-article.md');
    assert.match(contents, /^---\ntitle: "A Useful Article"\ndescription: ""\nstatus: draft\ntags: \[\]\n---/);
    assert.match(contents, /\n## A Useful Article\n/);
    assert.match(contents, /Draft notes/);
  });
});

test('quotes titles safely and makes slugs from punctuation', async () => {
  await withTempDir(async (root) => {
    const title = 'What’s “Next”? — A Guide';
    const filePath = await createDraftPost({ title, contentDir: root });
    const contents = await readFile(filePath, 'utf8');

    assert.equal(path.basename(filePath), 'what-s-next-a-guide.md');
    assert.ok(contents.includes(`title: ${JSON.stringify(title)}`));
  });
});

test('refuses duplicate slugs without changing the existing article', async () => {
  await withTempDir(async (root) => {
    const filePath = await createDraftPost({ title: 'Same title', contentDir: root });
    const before = await readFile(filePath, 'utf8');

    await assert.rejects(
      createDraftPost({ title: 'Same Title!', contentDir: root }),
      /already exists/i,
    );
    assert.equal(await readFile(filePath, 'utf8'), before);
  });
});

test('rejects empty, unusable, and path-like titles without writing outside the target', async () => {
  await withTempDir(async (root) => {
    const outputDir = path.join(root, 'blog');
    await assert.rejects(createDraftPost({ title: '  ', contentDir: outputDir }), /title/i);
    await assert.rejects(createDraftPost({ title: '?!', contentDir: outputDir }), /title/i);
    await assert.rejects(createDraftPost({ title: '../escape', contentDir: outputDir }), /path/i);
    await assert.rejects(createDraftPost({ title: 'folder\\escape', contentDir: outputDir }), /path/i);

    assert.deepEqual(await readdir(root), []);
  });
});
