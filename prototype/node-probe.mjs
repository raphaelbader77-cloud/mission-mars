import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadPyodide } from 'pyodide';
import { PGlite } from '@electric-sql/pglite';
import { runProbe } from './bridge.mjs';

const directory = await mkdtemp(path.join(os.tmpdir(), 'mission-mars-probe-'));
const python = await readFile(new URL('./probe.py', import.meta.url), 'utf8');
const started = performance.now();
try {
  const runtime = await loadPyodide();
  for (const previous of [0, 1]) {
    const database = await PGlite.create(directory);
    try {
      const report = await runProbe(runtime, database, python);
      assert.equal(report.previous.visits, previous);
      assert.equal(report.restored, previous > 0);
      console.log(JSON.stringify(report));
    } finally {
      runtime.unregisterJsModule('ares_probe');
      runtime.runPython("import sys; sys.modules.pop('ares_probe', None); None");
      await database.close();
    }
  }
  console.log('Elapsed (ms):', Math.round(performance.now() - started));
  console.log('Process memory (MiB):', Object.fromEntries(
    Object.entries(process.memoryUsage()).map(([key, bytes]) => [key, +(bytes / 2**20).toFixed(1)])
  ));
} finally {
  await rm(directory, { recursive: true, force: true });
}
