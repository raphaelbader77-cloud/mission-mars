// A separate database keeps the experiment independent of the player's save.
export async function runProbe(runtime, database, pythonSource) {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS probe_candidates (name TEXT PRIMARY KEY, years INTEGER NOT NULL);
    INSERT INTO probe_candidates VALUES ('Alex',8), ('Maya',9), ('Lucas',3)
      ON CONFLICT (name) DO NOTHING;
    CREATE TABLE IF NOT EXISTS probe_progress (
      slot INTEGER PRIMARY KEY CHECK (slot = 1), visits INTEGER NOT NULL
    );
    INSERT INTO probe_progress VALUES (1, 0) ON CONFLICT DO NOTHING;
    CREATE TABLE IF NOT EXISTS probe_log (visit INTEGER PRIMARY KEY);
  `);

  async function snapshot(connection) {
    const result = await connection.query(`
      SELECT visits, (SELECT count(*)::integer FROM probe_log) AS records
      FROM probe_progress WHERE slot = 1
    `);
    return result.rows[0];
  }

  runtime.registerJsModule('ares_probe', {
    async execute(statement, parameters) {
      try {
        const { rows } = await database.query(statement, JSON.parse(parameters));
        return JSON.stringify({ rows });
      } catch (error) {
        return JSON.stringify({ code: error.code, message: error.message });
      }
    },
    async commit_visit() {
      const result = await database.transaction(async (connection) => {
        const previous = await snapshot(connection);
        const visit = previous.visits + 1;
        await connection.query('INSERT INTO probe_log VALUES ($1)', [visit]);
        await connection.query('UPDATE probe_progress SET visits = $1 WHERE slot = 1', [visit]);
        return [previous, await snapshot(connection)];
      });
      return JSON.stringify(result);
    },
  });

  await runtime.runPythonAsync(pythonSource);
  return JSON.parse(await runtime.runPythonAsync('await run_probe()'));
}
