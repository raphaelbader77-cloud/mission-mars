import { $, esc, icon, btn, num, table } from "./ui-kit.js";
import { guide, missions, chapters } from "./screens.js";
const dialog = () => $("dialog");
export function modal(title, body) {
  const d = dialog();
  d.innerHTML = `<div class="modalhead"><h2>${esc(title)}</h2>${btn("close", icon("close", 16), "tiny", 'aria-label="Close dialog"')}</div><div class="modalbody">${body}<p class="modal-notice" id="modal-notice" role="status"></p></div>`;
  if (!d.open) d.showModal();
}
export const closeModal = () => {
  if (dialog().open) dialog().close();
};
export function guidePanel(s) {
  modal(
    "SQL Guide",
    '<label class="search-label">Search the field reference<input id="search" type="search" placeholder="Search commands or topics…"></label><div id="entries"></div>',
  );
  const search = $("search");
  function matches() {
    const q = search.value.trim().toLowerCase();
    const found = guide.filter((g) =>
      [g.name, g.explanation, g.syntax].join(" ").toLowerCase().includes(q),
    );
    $("entries").innerHTML =
      found
        .map(
          (g) =>
            `<details class="guide-entry" ${found.length === 1 ? "open" : ""}><summary><span>${esc(g.name)}</span><small>${s.completed >= g.id ? "LEARNED" : "FIELD NOTE"}</small></summary><p>${esc(g.explanation)}</p><div class="cap">SYNTAX</div><pre>${esc(g.syntax)}</pre><div class="cap">EXAMPLE</div><pre>${esc(g.example)}</pre><p><b>Common mistake.</b> ${esc(g.mistake)}</p><a href="${g.url}" target="_blank" rel="noopener">W3Schools reference ↗</a></details>`,
        )
        .join("") || "<p>No entries match this search.</p>";
  }
  matches();
  search.oninput = matches;
}
export function directory(s) {
  modal(
    "Chapter Selection",
    `<div class="chapterfirst"><span class="eyebrow">CHAPTER 01 &nbsp; · &nbsp; ${s.completed}/${missions.length} COMPLETE</span><h3>Project ARES</h3><p>Earth · ARES Space Center</p>
 ${missions.map((m) => btn("mission-select", `<span class="idx">${num(m.id)}</span><span>${esc(m.title)}</span><small>${m.id <= s.completed ? "REPLAY" : m.id === s.completed + 1 ? "OPEN" : "LOCKED"}</small>`, "directory-row", `data-id="${m.id}" ${m.id > s.completed + 1 ? "disabled" : ""}`)).join("")}
 ${s.completed === missions.length ? btn("summary", "View flight crew", "primary") : ""}</div><div class="cap">PLANNED CHAPTERS</div>${chapters
   .slice(1)
   .map(
     ([title, place, story], i) =>
       `<details class="guide-entry"><summary><span>${num(i + 2)} &nbsp; ${esc(title)}</span><small>${icon("lock", 11)} LOCKED</small></summary><p>${esc(place)}. ${esc(story)}</p><small>Coming in a future expansion.</small></details>`,
   )
   .join("")}`,
  );
}
export function settings(s) {
  modal(
    "Settings",
    `<div class="setting"><div><strong>Sound effects</strong><small>Terminal tones and mission signals</small></div>${btn("sound", s.sound ? "On" : "Off", "switch", 'aria-pressed="' + s.sound + '"')}</div>
 <div class="setting"><div><strong>Motion effects</strong><small>System reduced-motion preference takes priority.</small></div>${btn("motion", s.motion ? "On" : "Off", "switch", 'aria-pressed="' + s.motion + '"')}</div>
 <div class="cap">LOCAL SAVE</div><p>Clearing browser data can erase your flight record. Keep an export to move your crew to another device.</p>
 <div class="buttons">${btn("export", "Export Save", "secondary", s.started ? "" : "disabled")}${btn("import", "Import Save", "secondary")}<input hidden type="file" id="file" accept=".json,application/json"></div><hr>${btn("reset", "Reset Progress", "danger", s.started ? "" : "disabled")}`,
  );
}
export function explorer(schema) {
  modal(
    "Database Explorer",
    `<span class="eyebrow">FLIGHT DATABASE / READ ONLY</span><h3>astronauts</h3><p>${schema.rows.length} records · ${schema.columns.length} columns · Primary key <code>id</code> · No foreign keys</p>
 ${table(
   ["Column", "PostgreSQL type", "Key"],
   schema.columns.map((c) => [c.name, c.type, c.primary ? "Primary key" : "—"]),
 )}<h3>Table contents</h3>${table(
   schema.columns.map((c) => c.name),
   schema.rows,
 )}`,
  );
}
export function credits() {
  modal(
    "Credits",
    `<span class="eyebrow">PROJECT ARES / FLIGHT SYSTEMS</span><h3>Mission Mars</h3><p>A Swiss Gymnasium computer science project for two students. Original story, training missions and pixel artwork created for Project ARES with AI assistance.</p><div class="cap">FLIGHT COMPUTER</div><p>Python in Pyodide · PostgreSQL in PGlite · CodeMirror 6 · Vite.</p><div class="cap">ART & AUDIO</div><p>Original pixel landscapes, crew sprites and portraits. Terminal sounds are synthesized on your device. Press Start 2P, Barlow and IBM Plex Mono are bundled under the SIL Open Font License.</p><div class="cap">FIELD REFERENCE</div><p>Lessons include optional further reading from W3Schools. SQL Island inspired the learn-by-playing format.</p>`,
  );
}
