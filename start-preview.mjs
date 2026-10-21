import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = fileURLToPath(new URL('.', import.meta.url));
const url = 'http://127.0.0.1:4173/';
async function probe() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    const html = await response.text();
    if (!response.ok || !html.includes('Elite Marathon')) {
      throw new Error('Port 4173 is occupied by another service. Close that service and retry.');
    }
    return true;
  } catch (error) {
    if (error.message.startsWith('Port 4173')) throw error;
    return false;
  }
}

try {
  if (!await probe()) {
    const log = openSync(path.join(directory, 'preview-server.log'), 'a');
    let failure;
    const server = spawn(process.execPath, [path.join(directory, 'server.mjs')], {
      cwd: directory, detached: true, windowsHide: true, stdio: ['ignore', log, log],
    });
    server.on('error', error => { failure = error; });
    server.unref();
    closeSync(log);
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (failure) throw failure;
      if (await probe()) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Server did not start. See preview-server.log for details.');
  }
  await new Promise((resolve, reject) => {
    const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' });
    browser.on('error', reject);
    browser.on('exit', code => code === 0 ? resolve() : reject(new Error('Could not open the browser.')));
  });
  console.log(`Opened ${url}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
