import child_process from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import createReleaseUrl from 'new-github-release-url';
import open from 'open';

const output = child_process.execSync('npx conventional-changelog -p angular -r 1');

const packageText = readFileSync(join(process.cwd(), 'package.json'));
const packageJson = JSON.parse(packageText.toString());
const tag = `v${packageJson.version}`;

const releaseUrl = createReleaseUrl({
  repoUrl: 'https://github.com/Videodock/tile-slider',
  tag: tag,
  title: tag,
  body: output.toString(),
});

open(releaseUrl);
