import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

// Both runtimes resolve their WASM and data files relative to their JS entry.
const packages = [
  [
    "pyodide",
    "pyodide",
    ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"],
  ],
  [
    "@electric-sql/pglite/dist",
    "pglite",
    ["index.js", "initdb.js", "initdb.wasm", "pglite.js", "pglite.wasm", "pglite.data"],
    /^chunk-[\w-]+\.js$/,
  ],
];
for (const [source, folder, required, chunks] of packages) {
  const from = join("node_modules", source);
  const to = join("public/vendor", folder);
  const installed = await readdir(from);
  const missing = required.filter((file) => !installed.includes(file));
  if (missing.length) {
    throw new Error(`Missing runtime files in ${from}: ${missing.join(", ")}`);
  }

  const files = required.concat(installed.filter((file) => chunks?.test(file)));
  await rm(to, { recursive: true, force: true });
  await mkdir(to, { recursive: true });
  for (const file of files) {
    await copyFile(join(from, file), join(to, file));
  }
}
