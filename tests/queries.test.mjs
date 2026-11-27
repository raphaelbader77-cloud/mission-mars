import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { loadPyodide } from "pyodide";
import { Database } from "../src/js/database.js";
import missions from "../content/missions.json" with { type: "json" };

const alternatives = [
  " SeLeCt  a.*  \n FROM astronauts AS a ORDER BY id DESC ; ",
  "SELECT a.name AS badge, a.role FROM astronauts a ORDER BY a.name DESC",
  " select  distinct a.role  FROM astronauts a ORDER BY a.role DESC ",
  "SELECT * FROM astronauts WHERE ('Engineer' = role)",
  "SELECT * FROM astronauts WHERE 8 <= experience",
  "SELECT * FROM astronauts WHERE available AND 5 <= experience AND 'Engineer' = role",
  "SELECT * FROM astronauts WHERE role IN ('Scientist','Doctor')",
  "SELECT * FROM astronauts WHERE medical_status <> 'pending'",
  "SELECT name AS candidate,role FROM astronauts WHERE available AND 6 <= experience AND 'cleared' = medical_status",
];
const incomplete = [
  "SELECT * FROM astronauts WHERE available",
  "SELECT name, role FROM astronauts WHERE available",
  "SELECT role FROM astronauts",
  "SELECT * FROM astronauts WHERE role='Doctor'",
  "SELECT * FROM astronauts WHERE experience > 8",
  "SELECT * FROM astronauts WHERE role='Engineer' AND experience>=5",
  "SELECT * FROM astronauts WHERE role='Scientist'",
  "SELECT * FROM astronauts WHERE medical_status='pending'",
  "SELECT name,role FROM astronauts WHERE available AND experience>=6",
];

test("Chapter 1 through the production Python–PostgreSQL bridge", async (t) => {
  const [py, pg] = await Promise.all([loadPyodide(), PGlite.create()]);
  const db = new Database(pg);
  await db.initialize();
  for (const file of ["game.py", "domain.py"]) {
    py.FS.writeFile(
      "/home/pyodide/" + file,
      await readFile("src/python/" + file, "utf8"),
    );
  }
  py.globals.set("missions_json", JSON.stringify(missions));
  py.globals.set("save_json", "null");
  py.registerJsModule("flight_bridge", {
    query: async (sql, ref) => JSON.stringify(await db.evaluate(sql, ref)),
  });
  await py.runPythonAsync(await readFile("src/python/bridge.py", "utf8"));
  const command = py.globals.get("operate");
  const call = async (action, value = null) =>
    JSON.parse(await command(action, JSON.stringify(value)));
  try {
    await call("new");
    await call("intro");
    await t.test(
      "orientation validates an inspected row and attribute",
      async () => {
        assert.equal((await call("attempt", {})).answer.status, "review");
        assert.equal(
          (await call("attempt", { row: 1, column: "role" })).answer.status,
          "pass",
        );
      },
    );
    for (const m of missions.slice(1)) {
      await t.test("M" + m.id + " " + m.title, async () => {
        await call("select", m.id);
        const tryQuery = async (sql) => (await call("attempt", sql)).answer;
        for (const [query, status] of [
          ["", "empty"],
          [" SELEC * FROM astronauts", "syntax"],
          ["UPDATE astronauts SET experience=0", "restricted"],
          ["SELECT id FROM astronauts", "review"],
          ["SELECT unknown_field FROM astronauts", "database"],
          [incomplete[m.id - 2], "review"],
          [m.solution, "pass"],
          [alternatives[m.id - 2], "pass"],
          [
            " \n " +
              m.solution
                .replaceAll("SELECT", "sElEcT")
                .replaceAll("FROM", "\n  fRoM") +
              "  ",
            "pass",
          ],
        ])
          assert.equal((await tryQuery(query)).status, status, query);
        assert.equal((await call("status")).state.completed, m.id);
      });
    }
    await t.test(
      "a roster-specific shortcut fails the second dataset",
      async () => {
        await call("select", 6);
        const report = (
          await call(
            "attempt",
            "SELECT * FROM astronauts WHERE id IN (1,2,4,6,10,11,13)",
          )
        ).answer;
        assert.equal(report.status, "review");
        assert.match(report.message, /second training roster/);
      },
    );
    await t.test(
      "read-only query policy bounds the chapter grammar",
      async () => {
        const reference = missions[1].solution;
        for (const input of [
          "DELETE FROM astronauts",
          "SELECT 1 FROM astronauts",
          "SELECT * FROM public.game_save",
          "SELECT * FROM astronauts; SELECT * FROM astronauts",
          "SELECT * FROM astronauts a, astronauts b",
          "SELECT * FROM astronauts WHERE length(name) > 0",
          "x".repeat(1801),
        ]) {
          assert.equal(
            (await db.evaluate(input, reference)).kind,
            "restricted",
            input,
          );
        }
        assert.equal((await db.inspect()).rows.length, 13);
      },
    );
    await t.test(
      "save serialization preserves settings, replay position and active crew",
      async () => {
        await call("pilot", "wilson");
        await call("settings", { sound: false });
        const exported = (await call("export")).answer;
        await db.save(exported);
        await call("reset");
        const restored = await call("import", await db.readSave());
        assert.equal(restored.state.completed, 10);
        assert.equal(restored.state.crew[3].name, "James Wilson");
        assert.equal(restored.state.sound, false);
        assert.equal(restored.state.current, 6);
      },
    );
  } finally {
    command.destroy();
    await pg.close();
  }
});
