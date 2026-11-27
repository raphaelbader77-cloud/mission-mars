import "../style.css";
import { $, esc, icon, btn, tone, notify } from "./ui-kit.js";
import {
  header,
  menu,
  foot,
  briefing,
  missionScreen,
  missions,
} from "./screens.js";
import { completed, feedback as feedbackView } from "./screens.js";
import {
  modal,
  closeModal,
  guidePanel,
  directory,
  settings,
  explorer,
  credits,
} from "./panels.js";
import { Runtime } from "./runtime.js";

const runtime = new Runtime();
let state = {
  started: false,
  current: 1,
  completed: 0,
  sound: true,
  motion: true,
};
let screen = "menu",
  introStep = 0,
  editor = null,
  hints = 0,
  touches = {},
  output = null,
  busy = false;
let databaseCache, bootError, pendingImport;
const drafts = new Map();
const mission = () => missions[state.current - 1];
let ready;
function toolbar() {
  document.body.classList.toggle("still", !state.motion);
  const el = document.querySelector("header");
  if (el) el.outerHTML = header(state, screen !== "menu");
}
async function send(action, value) {
  await ready;
  if (bootError) throw bootError;
  const response = await runtime.send(action, value);
  if (response.state) state = response.state;
  toolbar();
  return response.answer;
}
function paint() {
  editor?.destroy();
  editor = null;
  const content =
    screen === "menu"
      ? menu(state)
      : screen === "brief"
        ? briefing(introStep)
        : screen === "final"
          ? completed(state)
          : missionScreen(state, mission());
  $("app").innerHTML =
    '<main class="shell">' +
    header(state, screen !== "menu") +
    content +
    foot() +
    "</main>";
  toolbar();
  window.scrollTo(0, 0);
  if (screen === "mission") {
    if (state.current > 1) {
      const m = mission();
      const target = $("editor");
      import("./editor.js")
        .then(({ buildEditor }) => {
          if (!target.isConnected) return;
          editor = buildEditor(
            target,
            drafts.get(m.id) ?? "",
            () => dispatch("run"),
            (val) => drafts.set(m.id, val),
          );
        })
        .catch((e) => notify(e.message));
      renderHints();
    }
    renderResult();
  }
}
function enter(next) {
  closeModal();
  screen = next;
  output = null;
  hints = 0;
  touches = {};
  paint();
}
function renderResult() {
  if (output) $("result").innerHTML = feedbackView(output, mission());
  else if (state.current <= state.completed)
    $("result").innerHTML =
      '<div class="panel replay"><small>Previously completed · replay this assignment at any time.</small>' +
      btn(
        "next",
        state.current === missions.length ? "View flight crew" : "Next mission",
        "secondary",
      ) +
      "</div>";
}
function renderHints() {
  $("hint-log").innerHTML = mission()
    .hints.slice(0, hints)
    .map(
      (h, i) =>
        "<div><small>" +
        ["1 · CONCEPT", "2 · SYNTAX", "3 · SOLUTION"][i] +
        "</small>" +
        (i === 2 ? "<pre>" + esc(h) + "</pre>" : "<p>" + esc(h) + "</p>") +
        "</div>",
    )
    .join("");
  $("hint-btn").textContent =
    hints === 3 ? "All hints revealed" : "Reveal hint " + (hints + 1) + " of 3";
  $("hint-btn").disabled = hints === 3;
}
function replaceQuery(value) {
  if (editor) {
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
    });
    editor.focus();
  }
}
function confirmPanel(title, text, action, label) {
  modal(
    title,
    "<p>" +
      esc(text) +
      '</p><div class="buttons">' +
      btn(action, label, "primary") +
      btn("close", "Cancel", "secondary") +
      "</div>",
  );
}
async function startNew() {
  await send("new");
  drafts.clear();
  introStep = 0;
  enter("brief");
}
async function attempt(value) {
  output = await send("attempt", value);
  renderResult();
  tone(output.status === "pass" ? "ok" : "bad", state.sound);
  if (output.status === "pass") {
    const bars = document.querySelectorAll(".segments i");
    bars.forEach((el, i) => el.classList.toggle("done", i < state.completed));
  }
}
async function handler(action, el) {
  switch (action) {
    case "home":
      enter("menu");
      break;
    case "close":
      closeModal();
      break;
    case "guide":
      guidePanel(state);
      break;
    case "credits":
      credits();
      break;
    case "settings":
      await ensure();
      settings(state);
      break;
    case "chapters":
      await ensure();
      directory(state);
      break;
    case "new":
      await ensure();
      if (state.started)
        confirmPanel(
          "Start a new game?",
          "This replaces your local flight record. Export your current save in Settings to keep a copy.",
          "confirm-new",
          "Start New Game",
        );
      else await startNew();
      break;
    case "confirm-new":
      await startNew();
      break;
    case "continue":
      await ensure();
      if (state.started)
        enter(
          !state.intro_seen
            ? "brief"
            : state.completed === missions.length && state.current === missions.length
              ? "final"
              : "mission",
        );
      break;
    case "brief-next":
      if (introStep === 0) {
        introStep = 1;
        tone("radio", state.sound);
        paint();
        break;
      }
    case "brief-skip":
      await send("intro");
      enter("mission");
      break;
    case "tour-row":
      touches.row = 1;
      $("tour-row").classList.add("selected");
      $("tour-col").disabled = false;
      $("tour-tip").textContent =
        "This row contains Alex’s record. Now select the role column header to inspect one attribute across candidates.";
      break;
    case "tour-col":
      touches.column = "role";
      $("tour-col").classList.add("selected");
      $("tour-tip").textContent =
        "The role column stores one attribute for every astronaut. Alex’s role is Engineer.";
      await attempt(touches);
      break;
    case "explore":
      databaseCache ??= await send("inspect");
      explorer(databaseCache);
      break;
    case "run":
      if (editor) await attempt(editor.state.doc.toString());
      break;
    case "hint":
      hints = Math.min(hints + 1, 3);
      renderHints();
      break;
    case "clear":
      replaceQuery("");
      break;
    case "reset-query":
      drafts.delete(state.current);
      replaceQuery("");
      hints = 0;
      renderHints();
      output = null;
      $("result").replaceChildren();
      renderResult();
      break;
    case "mission-select":
      if (!state.started) {
        await startNew();
        break;
      }
      await send("select", Number(el.dataset.id));
      enter(state.intro_seen ? "mission" : "brief");
      break;
    case "next":
      if (state.current === missions.length) {
        enter("final");
        break;
      }
      await send("select", state.current + 1);
      enter("mission");
      break;
    case "summary":
      enter("final");
      break;
    case "sound":
    case "motion": {
      const open = $("dialog").open;
      await send("settings", { [action]: !state[action] });
      if (action === "sound" && state.sound) tone("click", true);
      if (open) settings(state);
      break;
    }
    case "export": {
      const data = await send("export");
      const link = document.createElement("a"),
        url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        );
      link.href = url;
      link.download = "mission-mars-save.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      notify("Flight record exported.");
      break;
    }
    case "import":
      $("file").click();
      break;
    case "confirm-import":
      await send("import", pendingImport);
      pendingImport = null;
      drafts.clear();
      enter("menu");
      notify("Flight record restored.");
      break;
    case "reset":
      confirmPanel(
        "Reset progress?",
        "This clears your crew and completed assignments on this device.",
        "confirm-reset",
        "Reset Progress",
      );
      break;
    case "confirm-reset":
      await send("reset");
      drafts.clear();
      introStep = 0;
      enter("menu");
      notify("Local progress reset.");
      break;
  }
}
async function ensure() {
  if (!bootError && !runtime.release && !$("dialog").open)
    modal(
      "Connecting to ARES",
      '<p class="loading">Starting the local Python interpreter and flight database…</p>',
    );
  await ready;
  if (bootError) throw bootError;
  if ($("dialog").querySelector(".loading")) closeModal();
}
async function dispatch(action, el) {
  if (busy) return;
  busy = true;
  try {
    if (!["run", "sound", "tour-col"].includes(action))
      tone("click", state.sound);
    await handler(action, el);
  } catch (e) {
    if (bootError)
      modal(
        "Flight computer offline",
        "<p>" +
          esc(bootError.message) +
          "</p>" +
          btn("reload", "Retry connection", "primary"),
      );
    else notify(e.message);
  } finally {
    busy = false;
  }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  if (el.dataset.act === "reload") {
    location.reload();
    return;
  }
  dispatch(el.dataset.act, el);
});
document.addEventListener("change", async (e) => {
  try {
    if (e.target.id === "pilot") {
      await send("pilot", e.target.value);
      paint();
    }
    if (e.target.id === "file" && e.target.files.length) {
      const file = e.target.files[0];
      if (file.size > 65536)
        throw new Error("Save files must be smaller than 64 KiB.");
      try {
        pendingImport = JSON.parse(await file.text());
      } catch {
        throw new Error("This file is not valid JSON.");
      }
      confirmPanel(
        "Restore flight record?",
        "Importing replaces the current local save.",
        "confirm-import",
        "Import Save",
      );
    }
  } catch (e) {
    notify(e.message);
  }
});
paint();
ready = runtime
  .start()
  .then((s) => {
    state = s;
    if (screen === "menu") paint();
    else toolbar();
  })
  .catch((e) => {
    bootError = e;
    notify("Flight computer unavailable. Open New Game for details.");
  });
