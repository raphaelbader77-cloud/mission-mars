import { analyse, QueryIssue } from "./query-policy.js";
import roster from "../../content/roster.json" with { type: "json" };

const schema = `(id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
  experience INTEGER NOT NULL, available BOOLEAN NOT NULL, medical_status TEXT NOT NULL)`;
const fields = [
  "id",
  "name",
  "role",
  "experience",
  "available",
  "medical_status",
];
// This second fixture changes IDs, roles and boundary values to expose coincidental answers.
const calibration = [
  [41, "Ada", "Engineer", 5, true, "cleared"],
  [42, "Ben", "Engineer", 8, false, "cleared"],
  [43, "Cam", "Scientist", 6, true, "pending"],
  [44, "Dee", "Doctor", 6, true, "cleared"],
  [45, "Eli", "Engineer", 4, true, "cleared"],
  [46, "Flo", "Scientist", 8, true, "cleared"],
  [47, "Gio", "Pilot", 5, true, "cleared"],
  [48, "Hal", "Doctor", 7, false, "pending"],
  [49, "Ida", "Engineer", 6, true, "pending"],
  [50, "Jay", "Pilot", 9, true, "cleared"],
];
export class Database {
  constructor(pg) {
    this.pg = pg;
  }
  async initialize() {
    await this.pg.transaction(async (tx) => {
      await tx.exec(`CREATE SCHEMA IF NOT EXISTS flight;
        CREATE SCHEMA IF NOT EXISTS calibration;
        CREATE TABLE IF NOT EXISTS flight.astronauts ${schema};
        CREATE TABLE IF NOT EXISTS calibration.astronauts ${schema};
        CREATE TABLE IF NOT EXISTS public.game_save (id integer primary key, payload jsonb not null);`);
      for (const [schemaName, rows] of [
        ["flight", roster],
        ["calibration", calibration],
      ]) {
        for (const row of rows)
          await tx.query(
            `INSERT INTO ${schemaName}.astronauts VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
            row,
          );
      }
    });
  }
  async readSave() {
    return (
      (await this.pg.query("SELECT payload FROM public.game_save WHERE id = 1"))
        .rows[0]?.payload ?? null
    );
  }
  async save(payload) {
    await this.pg.query(
      "INSERT INTO public.game_save VALUES (1,$1::jsonb) ON CONFLICT (id) DO UPDATE SET payload=excluded.payload",
      [JSON.stringify(payload)],
    );
  }
  async inspect() {
    const schema = await this.pg
      .query(`SELECT column_name AS name, data_type AS type
      FROM information_schema.columns WHERE table_schema='flight' AND table_name='astronauts' ORDER BY ordinal_position`);
    const data = await this.pg.query(
      "SELECT * FROM flight.astronauts ORDER BY id",
      [],
      { rowMode: "array" },
    );
    return {
      table: "astronauts",
      columns: schema.rows.map((c) => ({
        ...c,
        primary: c.name === "id",
        foreign: null,
      })),
      rows: data.rows,
    };
  }
  async evaluate(input, reference) {
    try {
      const analysis = analyse(input);
      const sets = await this.pg.transaction(async (tx) => {
        await tx.exec(
          "SET TRANSACTION READ ONLY; SET LOCAL statement_timeout = '1500ms'",
        );
        const results = [];
        for (const name of ["flight", "calibration"]) {
          await tx.exec("SET LOCAL search_path TO " + name + ", pg_catalog");
          const run = async (sql) => {
            const result = await tx.query(sql, [], { rowMode: "array" });
            return {
              columns: result.fields.map((f) => [f.name, f.dataTypeID]),
              rows: result.rows,
            };
          };
          results.push({
            actual: await run(analysis.sql),
            expected: await run(reference),
          });
        }
        return results;
      });
      // Track source columns separately, so a harmless output alias can still qualify.
      const sources = analysis.projected.flatMap((name) =>
        name === "*" ? fields : [name],
      );
      return { sets, sources, distinct: analysis.distinct };
    } catch (error) {
      const help = {
        42703:
          "Check the column names in Database Explorer. Put text values in single quotes.",
        42883:
          "Compare fields of compatible types. Experience is a number and role is text.",
        "22P02":
          "Check the value type. Use a number for experience and TRUE or FALSE for availability.",
        57014: "This query exceeded the time limit. Try a simpler condition.",
      };
      return {
        error: error.message.slice(0, 450),
        kind: error instanceof QueryIssue ? error.kind : "database",
        help: help[error.code] ?? "",
      };
    }
  }
}
