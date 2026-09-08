import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const useNpmCli = process.platform === 'win32' && command === 'npm' && process.env.npm_execpath;
    const executable = useNpmCli ? process.execPath : command;
    const executableArgs = useNpmCli ? [process.env.npm_execpath, ...args] : args;
    const child = spawn(executable, executableArgs, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

const port = process.env.PORT || '4174';
const origin = `http://127.0.0.1:${port}`;
let server;
try {
  for (const report of ['lighthouse-report.report.json', 'lighthouse-report.report.html']) {
    rmSync(report, { force: true });
  }
  await run('npm', ['run', 'e2e:build']);
  server = spawn(process.execPath, ['tools/e2e/static-server.mjs'], {
    stdio: 'inherit', env: { ...process.env, PORT: port },
  });
  let serverError;
  server.once('error', (error) => { serverError = error; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await setTimeout(100);
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error(`Preview server failed to start; check port ${port}.`);
    try {
      ready = (await fetch(`${origin}/craftfocus/`, { signal: AbortSignal.timeout(1000) })).ok;
    } catch { /* Wait for the server to bind. */ }
    if (ready) break;
  }
  if (!ready) throw new Error('Preview server did not become ready.');
  try {
    await run('npm', ['exec', '--yes', 'lighthouse', '--', `${origin}/craftfocus/`,
      '--only-categories=performance,accessibility,best-practices,seo',
      process.platform === 'win32' ? '--chrome-flags="--headless --no-sandbox"' : '--chrome-flags=--headless --no-sandbox', '--output=json', '--output=html',
      '--output-path=./lighthouse-report']);
  } catch (error) {
    // Chrome Launcher can fail to remove its locked Windows temp directory
    // after Lighthouse has successfully written both reports.
    if (!existsSync('lighthouse-report.report.json') || !existsSync('lighthouse-report.report.html')) throw error;
    console.warn('Lighthouse wrote both reports; browser temp cleanup reported an error.');
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server?.kill();
}
