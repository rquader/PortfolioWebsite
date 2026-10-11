import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function slugifyTitle(title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createDraftPost({ title, contentDir }) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('Article title must not be empty.');
  }
  if (/[\\/]/.test(title)) {
    throw new Error('Article title must not contain path separators.');
  }

  const normalizedTitle = title.trim();
  const slug = slugifyTitle(normalizedTitle);
  if (!slug) {
    throw new Error('Article title must contain at least one letter or number.');
  }

  const destinationDir = path.resolve(contentDir);
  const filePath = path.resolve(destinationDir, `${slug}.md`);
  if (path.dirname(filePath) !== destinationDir) {
    throw new Error('Generated article path escapes the content directory.');
  }

  const contents = [
    '---',
    `title: ${JSON.stringify(normalizedTitle)}`,
    'description: ""',
    'status: draft',
    'tags: []',
    '---',
    '',
    `## ${normalizedTitle}`,
    '',
    '<!-- Draft notes: replace this section with your article. -->',
    '',
  ].join('\n');

  await mkdir(destinationDir, { recursive: true });
  try {
    await writeFile(filePath, contents, { flag: 'wx' });
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new Error(`Article already exists: ${filePath}`);
    }
    throw error;
  }

  return filePath;
}

async function runCli() {
  const title = process.argv[2];
  try {
    const filePath = await createDraftPost({
      title,
      contentDir: path.resolve(process.cwd(), 'src/content/blog'),
    });
    process.stdout.write(`Created draft: ${filePath}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) await runCli();
