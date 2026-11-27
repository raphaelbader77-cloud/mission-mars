import"./modulepreload-polyfill-P2Xu9kJm.js";var e=`"""Feasibility probe shared by the browser and Node runtime test."""
import json

from ares_probe import execute, commit_visit


class FeasibilityProbe:
    """Exercise the exact boundaries needed by Mission Mars."""

    async def run(self):
        answer = await self.query(
            "SELECT name, years FROM probe_candidates WHERE years >= $1 ORDER BY name",
            [8],
        )
        expected = [{"name": "Alex", "years": 8}, {"name": "Maya", "years": 9}]
        if answer["rows"] != expected:
            raise ValueError("The database result changed in transit.")

        error = await self.query("SELEC broken", [])
        if error.get("code") != "42601":
            raise ValueError("PostgreSQL did not report the expected syntax error.")

        # A real PostgreSQL error must leave the next independent query usable.
        check = await self.query("SELECT 42 AS answer", [])
        if check["rows"] != [{"answer": 42}]:
            raise ValueError("Query after syntax error failed.")

        # The bridge commits mission progress and the world change together.
        before, after = json.loads(await commit_visit())
        if after["visits"] != before["visits"] + 1 or after["records"] != after["visits"]:
            raise ValueError("The world and its progress disagree.")
        return {
            "rows": answer["rows"],
            "sqlstate": error["code"],
            "postgres_message": error["message"],
            "previous": before,
            "saved": after,
            "restored": before["visits"] > 0 and before["records"] == before["visits"],
        }

    @staticmethod
    async def query(statement, parameters):
        return json.loads(await execute(statement, json.dumps(parameters)))


async def run_probe():
    return json.dumps(await FeasibilityProbe().run())
`;async function t(e,t,n){await t.exec(`
    CREATE TABLE IF NOT EXISTS probe_candidates (name TEXT PRIMARY KEY, years INTEGER NOT NULL);
    INSERT INTO probe_candidates VALUES ('Alex',8), ('Maya',9), ('Lucas',3)
      ON CONFLICT (name) DO NOTHING;
    CREATE TABLE IF NOT EXISTS probe_progress (
      slot INTEGER PRIMARY KEY CHECK (slot = 1), visits INTEGER NOT NULL
    );
    INSERT INTO probe_progress VALUES (1, 0) ON CONFLICT DO NOTHING;
    CREATE TABLE IF NOT EXISTS probe_log (visit INTEGER PRIMARY KEY);
  `);async function r(e){return(await e.query(`
      SELECT visits, (SELECT count(*)::integer FROM probe_log) AS records
      FROM probe_progress WHERE slot = 1
    `)).rows[0]}return e.registerJsModule(`ares_probe`,{async execute(e,n){try{let{rows:r}=await t.query(e,JSON.parse(n));return JSON.stringify({rows:r})}catch(e){return JSON.stringify({code:e.code,message:e.message})}},async commit_visit(){let e=await t.transaction(async e=>{let t=await r(e),n=t.visits+1;return await e.query(`INSERT INTO probe_log VALUES ($1)`,[n]),await e.query(`UPDATE probe_progress SET visits = $1 WHERE slot = 1`,[n]),[t,await r(e)]});return JSON.stringify(e)}}),await e.runPythonAsync(n),JSON.parse(await e.runPythonAsync(`await run_probe()`))}var n=new URL(`./vendor/`,document.baseURI),r=new URL(`pyodide/`,n),i=e=>new URL(e,n).href,a=performance.now(),o=document.querySelector(`#status`);document.querySelector(`#reload`).addEventListener(`click`,()=>location.reload());async function s(){let[s,c]=await Promise.all([import(i(`pyodide/pyodide.mjs`)),import(i(`pglite/index.js`))]),[l,u]=await Promise.all([s.loadPyodide({indexURL:r.href}),c.PGlite.create(`idb://mission-mars-feasibility-v1`)]),d=performance.now(),f=await t(l,u,e);await u.close();let p=Math.round(performance.now()-a),m=l.runPython(`import sys; sys.version.split()[0]`),h=performance.getEntriesByType(`resource`).filter(({name:e})=>e.startsWith(n.href)).reduce((e,t)=>e+t.decodedBodySize,0)/2**20,g=performance.memory?.usedJSHeapSize;for(let e of f.rows){let t=document.querySelector(`tbody`).insertRow();t.insertCell().textContent=e.name,t.insertCell().textContent=e.years}let _={"Python version":m,"PostgreSQL syntax error":f.sqlstate+` • `+f.postgres_message,"Saved visits before this load":f.previous.visits,"Saved visits after commit":f.saved.visits,"Persisted log rows":f.saved.records,"Restored previous run":f.restored?`Yes`:`First run. Reload to verify.`,"Runtimes ready":Math.round(d-a)+` ms`,"Full test duration":p+` ms`,"Local vendor resources (decoded)":h.toFixed(1)+` MiB`,"JS heap estimate":g?(g/2**20).toFixed(1)+` MiB (excludes some WASM/native memory)`:`Unavailable in this browser`};for(let[e,t]of Object.entries(_)){let n=document.createElement(`dt`),r=document.createElement(`dd`);n.textContent=e,r.textContent=t,document.querySelector(`dl`).append(n,r)}document.querySelector(`#report`).hidden=!1,o.textContent=f.restored?`PASS • persisted database and progress restored.`:`PASS • first commit saved.`}s().catch(e=>{o.textContent=`Probe failed • `+(e?.message??e),console.error(e)});