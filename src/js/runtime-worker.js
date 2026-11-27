import bridgeSource from "../python/bridge.py?raw";
import { Database } from "./database.js";
import definitions from "../../content/missions.json";
import domainSource from "../python/domain.py?raw";
import gameSource from "../python/game.py?raw";

let engine, database;
async function boot({ base, slot }) {
  const pyURL = new URL("vendor/pyodide/", base).href;
  const pgURL = new URL("vendor/pglite/index.js", base).href;
  const [{ loadPyodide }, { PGlite }] = await Promise.all([
    import(/* @vite-ignore */ pyURL + "pyodide.mjs"),
    import(/* @vite-ignore */ pgURL),
  ]);
  const [py, pg] = await Promise.all([
    loadPyodide({ indexURL: pyURL }),
    PGlite.create("idb://" + slot),
  ]);
  database = new Database(pg);
  await database.initialize();
  py.FS.writeFile("/home/pyodide/domain.py", domainSource);
  py.FS.writeFile("/home/pyodide/game.py", gameSource);
  py.globals.set("missions_json", JSON.stringify(definitions));
  py.globals.set("save_json", JSON.stringify(await database.readSave()));
  py.registerJsModule("flight_bridge", {
    query: async (input, reference) =>
      JSON.stringify(await database.evaluate(input, reference)),
  });
  await py.runPythonAsync(bridgeSource);
  engine = py.globals.get("operate");
  return call("status", null);
}
async function call(action, value) {
  return JSON.parse(await engine(action, JSON.stringify(value ?? null)));
}
async function handle({ id, action, value }) {
  try {
    let result;
    if (action === "boot") result = await boot(value);
    else if (action === "inspect")
      result = { answer: await database.inspect() };
    else {
      const before = (await call("export")).answer;
      try {
        result = await call(action, value);
        if (JSON.stringify(before) !== JSON.stringify(result.save))
          await database.save(result.save);
      } catch (e) {
        await call("import", before);
        throw e;
      }
    }
    delete result.save;
    self.postMessage({ id, result });
  } catch (e) {
    const message =
      e.message?.match(/ValueError: ([^\n]+)/)?.[1] || e.message || String(e);
    self.postMessage({ id, error: message });
  }
}
// Pyodide and PGlite each have a single interpreter/connection.
let tail = Promise.resolve();
self.onmessage = (event) => {
  tail = tail.then(() => handle(event.data));
};
