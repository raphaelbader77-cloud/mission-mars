import pythonSource from './probe.py?raw';
import { runProbe } from './bridge.mjs';

const directory = new URL('./vendor/', document.baseURI);
const pyodideDirectory = new URL('pyodide/', directory);
const url = (relative) => new URL(relative, directory).href;
const started = performance.now();
const status = document.querySelector('#status');
document.querySelector('#reload').addEventListener('click', () => location.reload());

async function main() {
  const [pythonModule, sqlModule] = await Promise.all([
    import(/* @vite-ignore */ url('pyodide/pyodide.mjs')),
    import(/* @vite-ignore */ url('pglite/index.js')),
  ]);
  const [runtime, database] = await Promise.all([
    pythonModule.loadPyodide({ indexURL: pyodideDirectory.href }),
    sqlModule.PGlite.create('idb://mission-mars-feasibility-v1'),
  ]);
  const initialized = performance.now();
  const report = await runProbe(runtime, database, pythonSource);
  await database.close();
  const milliseconds = Math.round(performance.now() - started);
  const version = runtime.runPython('import sys; sys.version.split()[0]');
  const resources = performance.getEntriesByType('resource')
    .filter(({name}) => name.startsWith(directory.href));
  const assetMiB = resources.reduce((total, entry) => total + entry.decodedBodySize, 0) / 2 ** 20;
  const heap = performance.memory?.usedJSHeapSize;
  for (const row of report.rows) {
    const tr = document.querySelector('tbody').insertRow();
    tr.insertCell().textContent = row.name;
    tr.insertCell().textContent = row.years;
  }
  const details = {
    'Python version': version,
    'PostgreSQL syntax error': report.sqlstate + ' • ' + report.postgres_message,
    'Saved visits before this load': report.previous.visits,
    'Saved visits after commit': report.saved.visits,
    'Persisted log rows': report.saved.records,
    'Restored previous run': report.restored ? 'Yes' : 'First run. Reload to verify.',
    'Runtimes ready': Math.round(initialized - started) + ' ms',
    'Full test duration': milliseconds + ' ms',
    'Local vendor resources (decoded)': assetMiB.toFixed(1) + ' MiB',
    'JS heap estimate': heap ? (heap / 2 ** 20).toFixed(1) + ' MiB (excludes some WASM/native memory)' : 'Unavailable in this browser',
  };
  for (const [label, value] of Object.entries(details)) {
    const term = document.createElement('dt'), definition = document.createElement('dd');
    term.textContent = label;
    definition.textContent = value;
    document.querySelector('dl').append(term, definition);
  }
  document.querySelector('#report').hidden = false;
  status.textContent = report.restored ? 'PASS • persisted database and progress restored.' : 'PASS • first commit saved.';
}

main().catch((error) => {
  status.textContent = 'Probe failed • ' + (error?.message ?? error);
  console.error(error);
});
