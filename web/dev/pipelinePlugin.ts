// Dev-only Vite plugin: exposes POST /__debug/pipeline so the debug panel can
// rebuild a puzzle by running the Python pipeline against the live API.
// It is only registered when Vite runs with `--mode debug`.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const PIPELINE_DIR = path.resolve(__dirname, '..', '..', 'pipeline');

function pythonPath(): string {
  if (process.env.DLEADLOCK_PYTHON) return process.env.DLEADLOCK_PYTHON;
  const win = path.join(PIPELINE_DIR, '.venv', 'Scripts', 'python.exe');
  const unix = path.join(PIPELINE_DIR, '.venv', 'bin', 'python');
  return existsSync(win) ? win : unix;
}

export function pipelinePlugin(): Plugin {
  return {
    name: 'dleadlock-debug-pipeline',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__debug/pipeline', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const url = new URL(req.url ?? '', 'http://localhost');
        const game = url.searchParams.get('game') ?? 'descent';
        if (!/^[a-z]+$/.test(game)) {
          res.statusCode = 400;
          res.end();
          return;
        }
        const args = ['-m', 'dleadlock_pipeline', game];
        const date = url.searchParams.get('date');
        const hero = url.searchParams.get('hero');
        const mode = url.searchParams.get('mode');
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) args.push('--date', date);
        if (hero && /^\d+$/.test(hero)) args.push('--hero', hero);
        if (mode && /^[a-z-]+$/.test(mode)) args.push('--mode', mode);
        if (url.searchParams.get('refresh') === '1') args.push('--refresh');

        const child = spawn(pythonPath(), args, { cwd: PIPELINE_DIR });
        let log = '';
        child.stdout.on('data', (d) => (log += d));
        child.stderr.on('data', (d) => (log += d));
        child.on('error', (err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, log: String(err) }));
        });
        child.on('close', (code) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: code === 0, log }));
        });
      });
    },
  };
}
