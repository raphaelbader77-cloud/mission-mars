export const $ = (id) => document.getElementById(id);
export const art = (id) => new URL("art/" + id + ".png", document.baseURI).href;
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export const num = (n) => String(n).padStart(2, "0");
const pixels = {
  ares: [
    "00000100000",
    "00001110000",
    "00011011000",
    "00111011100",
    "00110001100",
    "01100000110",
    "11110101111",
    "11001110011",
  ],
  play: [
    "1100000",
    "1111000",
    "1111110",
    "1111111",
    "1111110",
    "1111000",
    "1100000",
  ],
  disk: [
    "11111110",
    "11000111",
    "11000111",
    "11111111",
    "10000001",
    "10111101",
    "10100101",
    "11111111",
  ],
  map: [
    "10011001",
    "11100111",
    "10100101",
    "10100101",
    "10100101",
    "11100111",
    "10011001",
  ],
  book: [
    "11100111",
    "10011001",
    "10111011",
    "10011001",
    "10111011",
    "10011001",
    "11111111",
    "00011000",
  ],
  crew: [
    "01100010",
    "11110111",
    "01100010",
    "00000000",
    "01110011",
    "11111111",
    "11111011",
  ],
  sound: [
    "00010010",
    "00110001",
    "11110101",
    "11110101",
    "11110101",
    "00110001",
    "00010010",
  ],
  mute: [
    "00010000",
    "00110000",
    "11110101",
    "11110010",
    "11110101",
    "00110000",
    "00010000",
  ],
  gear: [
    "00111100",
    "10111101",
    "11100111",
    "11000011",
    "11000011",
    "11100111",
    "10111101",
    "00111100",
  ],
  signal: [
    "00000011",
    "00000011",
    "00011011",
    "00011011",
    "01111011",
    "01111011",
  ],
  terminal: [
    "11111111",
    "10000001",
    "10100001",
    "10010001",
    "10100101",
    "10000001",
    "11111111",
  ],
  lock: [
    "0011100",
    "0100010",
    "0100010",
    "1111111",
    "1110111",
    "1110111",
    "1111111",
  ],
  star: [
    "0001000",
    "0001000",
    "0011100",
    "1111111",
    "0011100",
    "0001000",
    "0001000",
  ],
  globe: [
    "00111100",
    "01101010",
    "11011111",
    "11111011",
    "11000111",
    "01100110",
    "00111100",
  ],
  close: [
    "1100011",
    "0110110",
    "0011100",
    "0001000",
    "0011100",
    "0110110",
    "1100011",
  ],
};
export function icon(name, size = 20) {
  const b = pixels[name] || pixels.star;
  const d = b
    .flatMap((row, y) =>
      [...row].map((v, x) => (v === "1" ? "M" + x + " " + y + "h1v1h-1z" : "")),
    )
    .join("");
  return (
    '<svg aria-hidden="true" width="' +
    size +
    '" height="' +
    size +
    '" viewBox="0 0 ' +
    b[0].length +
    " " +
    b.length +
    '" shape-rendering="crispEdges"><path fill="currentColor" d="' +
    d +
    '"/></svg>'
  );
}
export const btn = (action, label, cls = "", extra = "") =>
  '<button type="button" class="' +
  cls +
  '" data-act="' +
  action +
  '" ' +
  extra +
  ">" +
  label +
  "</button>";
export const table = (cols, rows) =>
  '<div class="scrolltable" tabindex="0" aria-label="Scrollable data table"><table><thead><tr>' +
  cols.map((c) => "<th>" + esc(c) + "</th>").join("") +
  "</tr></thead><tbody>" +
  rows
    .map(
      (row) =>
        "<tr>" +
        row
          .map((cell) => "<td>" + esc(cell === null ? "NULL" : cell) + "</td>")
          .join("") +
        "</tr>",
    )
    .join("") +
  "</tbody></table></div>";
let context;
export function tone(kind, enabled) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") context.resume().catch(() => {});
    const notes = {
      ok: [392, 523, 659],
      bad: [176, 132],
      click: [350],
      radio: [622, 466],
    }[kind] || [350];
    notes.forEach((hz, i) => {
      const o = context.createOscillator(),
        g = context.createGain(),
        t = context.currentTime + i * 0.074;
      o.type = "square";
      o.frequency.value = hz;
      g.gain.setValueAtTime(0.018, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.077);
      o.connect(g);
      g.connect(context.destination);
      o.start(t);
      o.stop(t + 0.08);
    });
  } catch {
    /* Device has no audio output. */
  }
}
export function notify(message) {
  const n = $("dialog").open ? $("modal-notice") : $("notice");
  n.textContent = message;
  n.classList.add("visible");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => n.classList.remove("visible"), 4800);
}
