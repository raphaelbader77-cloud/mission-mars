import { art, esc, icon, btn, num, table } from "./ui-kit.js";
import guide from "../../content/guide.json";
import missions from "../../content/missions.json";
import chapters from "../../content/chapters.json";
export { guide, missions, chapters };

export function header(s, inGame = false) {
  return `<header class="top"><button class="brand" data-act="home" aria-label="ARES main menu"><i>${icon("ares", 26)}</i><b>ARES</b><span class="brandtext">FLIGHT SYSTEMS</span></button>
 <div class="system"><span class="status-led"></span> SYSTEM ONLINE</div><div class="head-tools">
 ${inGame ? btn("guide", icon("book", 15) + "<span>SQL guide</span>", "tiny") : ""}
 ${btn("sound", icon(s.sound ? "sound" : "mute", 15) + "<span>SFX " + (s.sound ? "ON" : "OFF") + "</span>", "tiny", 'aria-label="Toggle sound"')}
 ${btn("settings", icon("gear", 16), "tiny gear", 'aria-label="Settings" title="Settings"')}</div></header>`;
}
const entry = (action, symbol, title, sub) =>
  btn(
    action,
    `<span class="tileicon">${icon(symbol, 24)}</span><span><strong>${title}</strong><small>${sub}</small></span><b class="chev">›</b>`,
    "tile",
  );
export function menu(s) {
  return `<section class="hero framed" aria-label="Mission Mars main menu">
 <img class="orbital" src="${art("orbit")}" alt="An ARES spacecraft flies above the cratered orange surface of Mars.">
 <div class="hero-top"><span class="tag"><i></i> PROJECT ARES</span><span class="micro orbit-label">ORBITAL VIEW &nbsp; / &nbsp; 01</span></div>
 <div class="hero-main"><h1><span>MISSION</span><em>MARS</em></h1>
 <p class="subtitle"><span></span> A SQL LEARNING ADVENTURE</p>
 <p class="premise">Command a crewed mission to Mars.<br>Write SQL to bring your crew together.</p>
 <div class="hero-actions">${btn("new", icon("play", 15) + "New Game", "primary")}${btn("continue", icon("disk", 16) + "Continue", "secondary", s.started ? "" : 'disabled title="Start a new game to create a save"')}</div></div>
 <div class="orbit-foot"><span class="micro">ARES–01 &nbsp; / &nbsp; FLIGHT PATH</span><span class="route"><i></i>EARTH<span class="line"></span><i></i>MARS</span></div>
 </section><nav class="tiles" aria-label="Flight terminal tools">${entry("chapters", "globe", "Chapter Selection", "Mission directory")}${entry("guide", "book", "SQL Guide", "Field reference")}${entry("credits", "crew", "Credits", "Project personnel")}</nav>`;
}
export const foot = () =>
  '<footer><span><b class="status-led"></b> ARES TERMINAL <i>/</i> V1.0</span><span>EARTH CONTROL <i>//</i> 2084</span></footer>';
export function briefing(step) {
  const data = [
    [
      "launchpad",
      "morgan",
      "Dr. Elena Morgan",
      "Mission Director",
      "Earth, 2084",
      "Welcome, Commander. Outpost Nine on Mars has gone silent. Project ARES will send a crew to investigate and establish a permanent colony. Your first assignment is here on Earth.",
    ],
    [
      "control",
      "nova",
      "NOVA",
      "Onboard Intelligence",
      "A signal from Mission Control",
      "The last packet from the outpost contained just a timestamp. I have kept the channel open. While we wait, let’s find the people who can take us there. Your flight roster is ready.",
    ],
  ][step];
  return `<section class="brief framed"><div class="cinema" style="background-image:url('${art(data[0])}')"><span class="tag">EARTH / ARES SPACE CENTER</span></div>
 <div class="briefbody"><span class="eyebrow">CHAPTER 01 &nbsp; / &nbsp; ARRIVAL</span><h2>${data[4]}</h2>${speech(data[1], data[2], data[3], data[5])}
 <div class="buttons">${btn("brief-next", step ? "Open crew roster" : "Continue briefing", "primary")}${btn("brief-skip", "Skip briefing", "linkbutton")}</div></div></section>`;
}
function speech(key, name, role, text) {
  return `<div class="speech"><img src="${art(key)}" alt=""><div><strong>${esc(name)}</strong> <small>${esc(role)}</small><p>${esc(text)}</p></div></div>`;
}
export function missionScreen(s, m) {
  const g = guide[m.guide - 1],
    p = s.characters[m.speaker];
  return `<div class="breadcrumb">${btn("chapters", "Mission directory", "linkbutton")} <span>/</span> CHAPTER 01 · PROJECT ARES</div>
 <section class="mission-head framed"><div class="scene" style="background-image:url('${art(m.scene)}')"></div><div class="mission-heading"><span class="eyebrow">ASSIGNMENT ${num(m.id)} / ${num(s.total)} &nbsp; · &nbsp; ${m.kind.toUpperCase()}</span><h2>${esc(m.title)}</h2><div class="segments" aria-label="${s.completed} missions completed">${missions.map((x) => '<i class="' + (x.id <= s.completed ? "done" : x.id === m.id ? "active" : "") + '"></i>').join("")}</div></div></section>
 <div class="workarea"><section class="left-pane"><div class="panel">${speech(m.speaker, p.name, p.role, m.dialogue)}<div class="objective"><span class="eyebrow">MISSION OBJECTIVE</span><h3>${esc(m.task)}</h3></div></div>
 <details class="panel lesson" ${m.kind === "Tutorial" || m.kind === "Orientation" ? "open" : ""}><summary>${icon("book", 16)} NOVA’s field notes</summary><p>${esc(g.explanation)}</p>
 ${m.id > 1 ? '<div class="cap">GENERAL SYNTAX</div><pre>' + esc(g.syntax) + '</pre><div class="cap">FIELD EXAMPLE</div><pre>' + esc(g.example) + "</pre>" : ""}
 <a target="_blank" rel="noopener" href="${g.url}">Read on W3Schools ↗</a></details>
 ${m.id > 1 ? '<div class="panel hintbox"><span class="eyebrow">NOVA ASSISTANCE</span><div id="hint-log"></div>' + btn("hint", "Reveal hint 1 of 3", "secondary", 'id="hint-btn"') + "</div>" : ""}</section>
 <section class="right-pane">${m.id === 1 ? orientation() : `<section class="panel editorpanel"><div class="paneltitle"><span>${icon("terminal", 17)} SQL console</span><span class="micro">POSTGRESQL</span></div><div id="editor"></div><div class="editorbar">${btn("run", icon("play", 13) + "Run Query", "primary", 'id="run"')}${btn("reset-query", "Reset Query", "linkbutton")}${btn("clear", "Clear", "linkbutton")}<span class="micro key">CTRL / ⌘ ↵</span></div></section>`}
 <div id="result" aria-live="polite"></div><div class="panel explorer-short"><div><strong>Database Explorer</strong><small>astronauts &nbsp;·&nbsp; 6 fields</small></div>${btn("explore", "Inspect table", "secondary")}</div>
 </section></div>`;
}
function orientation() {
  return `<div class="panel"><div class="paneltitle"><span>${icon("terminal", 16)} Roster orientation</span></div>
 <p id="tour-tip">Select Alex Chen’s row to inspect one astronaut record.</p>
 <div class="scrolltable"><table class="tour"><thead><tr><th>id</th><th>name</th><th>${btn("tour-col", "role", "cellbtn", 'id="tour-col" disabled')}</th></tr></thead>
 <tbody><tr id="tour-row"><td>1</td><td>${btn("tour-row", "Alex Chen", "cellbtn")}</td><td>Engineer</td></tr><tr><td>2</td><td>Sarah Miller</td><td>Engineer</td></tr><tr><td>3</td><td>James Wilson</td><td>Pilot</td></tr></tbody></table></div></div>`;
}
export function feedback(result, m) {
  const good = result.status === "pass";
  const title = good
    ? "Assignment complete"
    : result.status === "review"
      ? "Query ran · review the result"
      : result.status === "restricted"
        ? "Read-only roster"
        : result.status === "database"
          ? "PostgreSQL feedback"
          : result.status === "empty"
            ? "Console ready"
            : "Check your SQL";
  return `<section class="panel feedback ${good ? "pass" : "retry"}"><span class="eyebrow">${esc(title.toUpperCase())}</span><p>${esc(result.message)}</p>${result.help ? "<p>" + esc(result.help) + "</p>" : ""}
 ${
   result.preview
     ? '<div class="cap">QUERY RESULT · ' +
       result.preview.rows.length +
       " ROWS</div>" +
       table(
         result.preview.columns.map((x) => x[0]),
         result.preview.rows,
       )
     : ""
 }
 ${good ? btn("next", m.id === missions.length ? "View flight crew" : "Next mission", "primary") : ""}</section>`;
}
export function completed(s) {
  return `<section class="framed finale"><div class="crewscene" style="background-image:url('${art("launchpad")}')"><span class="tag">FLIGHT MANIFEST / APPROVED</span><div class="sprites">${s.crew.map((p) => '<img src="' + art(p.key + "-sprite") + '" alt="' + esc(p.name) + '">').join("")}</div></div><div class="briefbody"><span class="eyebrow">CHAPTER 01 COMPLETE · ${s.completed}/${s.total} ASSIGNMENTS</span><h2>Your crew is ready.</h2>${speech("morgan", "Dr. Elena Morgan", "Mission Director", "Excellent work, Commander. Your crew is ready. Our spacecraft is still missing critical components, and supplies are running low. Engineering is our next stop.")}
 <div class="crewgrid">${s.crew.map((p) => '<div><img src="' + art(p.key) + '" alt=""><strong>' + esc(p.name) + "</strong><small>" + esc(p.role) + "</small></div>").join("")}</div>
 <label>Flight pilot <select id="pilot"><option value="brown" ${s.pilot === "brown" ? "selected" : ""}>Oliver Brown · 15 years</option><option value="wilson" ${s.pilot === "wilson" ? "selected" : ""}>James Wilson · 6 years</option></select></label>
 <h3>SQL flight record</h3><p>SELECT · FROM · DISTINCT · WHERE · comparison operators · AND · OR · NOT</p><div class="nextchapter"><span class="eyebrow">COMING IN CHAPTER 02</span><h3>Building the Future</h3><p>Source materials and assemble the spacecraft at the engineering facility.</p></div>
 <div class="buttons">${btn("chapters", "Replay missions", "primary")}${btn("home", "Main menu", "secondary")}</div></div></section>`;
}
