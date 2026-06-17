import { execSync } from 'child_process';

export function getGitCommit() {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
}
