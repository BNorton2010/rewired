import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const directory = path.join(root, 'dist-pages');
// Build a separate Git index, keeping source files and the current branch intact.
// This does not create a Git worktree or an extra checkout.
const scratch = mkdtempSync(path.join(os.tmpdir(), 'rewired-pages-'));
const env = { ...process.env, GIT_INDEX_FILE: path.join(scratch, 'index') };
const git = (args, options = {}) => execFileSync('git', args, { cwd: root, env, encoding: 'utf8', ...options }).trim();
try {
  readFileSync(path.join(directory, '.nojekyll'));
  git(['read-tree', '--empty']);
  const files = [];
  const visit = folder => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) files.push(file);
      else throw new Error('Unexpected non-file in the Pages build');
    }
  };
  visit(directory);
  for (const file of files.sort()) {
    const blob = git(['hash-object', '-w', '--stdin'], { input: readFileSync(file) });
    git(['update-index', '--add', '--cacheinfo', '100644', blob, path.relative(directory, file).split(path.sep).join('/')]);
  }
  const tree = git(['write-tree']);
  const remote = git(['ls-remote', 'origin', 'refs/heads/gh-pages']).split(/\s/)[0];
  if (remote) git(['fetch', 'origin', 'refs/heads/gh-pages']);
  const commit = git(['commit-tree', tree, ...(remote ? ['-p', remote] : []), '-m', 'Publish Re-Wired FM browser demo']);
  execFileSync('git', ['push', 'origin', `${commit}:refs/heads/gh-pages`], { cwd: root, stdio: 'inherit' });
  console.log(`Published ${files.length} preview files to gh-pages (${commit}).`);
  console.log('GitHub Pages must be enabled for the gh-pages branch and root directory.');
} finally { rmSync(scratch, { recursive: true, force: true }); }
