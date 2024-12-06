import child_process from 'node:child_process';

import open from 'open';
import createReleaseUrl from 'new-github-release-url';

const output = child_process.execSync('npx conventional-changelog -p angular -r 2');
const tag = child_process.execSync('git describe --tags --abbrev=0');

const releaseUrl = createReleaseUrl({
  repoUrl: 'https://github.com/Videodock/tile-slider',
  tag: tag,
  title: tag,
  body: output.toString(),
});

open(releaseUrl);
