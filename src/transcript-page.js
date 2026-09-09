// A readable page for one review's whole conversation, and the place its exports are offered. The
// review panel is a working surface - narrow, scrolling, alongside the artifact. Reading a long
// review back, or handing it to someone who was not there, is a different job.
export function createTranscriptPageHtml({ key, title, file }) {
  const safeKey = encodeURIComponent(key);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title || "Review conversation")} · Lavish</title><style>
:root {
  color-scheme: dark;
  --bg: #0f1115;
  --bg-panel: #11141a;
  --bg-elevated: #1c212b;
  --fg: #f7f3ea;
  --fg-muted: #d8deea;
  --fg-faint: #aeb6c6;
  --fg-label: #8c96aa;
  --border: #303745;
  --border-subtle: #2a2f3a;
  --border-strong: #3c4557;
  --accent: #f4c95d;
  --accent-ink: #17130a;
  --radius-md: 10px;
  --radius-lg: 12px;
  --font-sans: Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.55 var(--font-sans); }
button, input { font: inherit; color: inherit; }
a { color: inherit; }
.shell { width: min(820px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 64px; }
h1 { margin: 0 0 6px; font-size: 22px; line-height: 1.25; }
.path { margin: 0 0 16px; color: var(--fg-label); font-family: var(--font-mono); font-size: 12px; overflow-wrap: anywhere; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
#filter { flex: 1 1 220px; min-width: 0; padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-panel); outline: none; }
#filter:focus { border-color: var(--accent); }
.button { padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-elevated); cursor: pointer; white-space: nowrap; text-decoration: none; }
.button:hover { border-color: var(--border-strong); }
#status { min-height: 20px; margin: 0 0 14px; color: var(--fg-label); font-size: 12px; }
.entry { padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-panel); margin-bottom: 10px; }
.entry.agent { background: transparent; }
.who { display: flex; gap: 10px; align-items: baseline; margin-bottom: 6px; color: var(--fg-label); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.when { font-weight: 400; letter-spacing: 0; text-transform: none; }
.target { margin-bottom: 6px; color: var(--fg-faint); font-family: var(--font-mono); font-size: 11px; overflow-wrap: anywhere; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--fg-muted); }
.empty, .error { padding: 40px 20px; border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--fg-label); text-align: center; }
.error { border-style: solid; border-color: #5d2b2b; color: #f0b5ab; }
@media print {
  body { background: #fff; color: #111; }
  .toolbar, #status { display: none; }
  .entry { border-color: #ccc; background: #fff; break-inside: avoid; }
  .text { color: #111; }
}
</style></head><body><main class="shell">
<h1>${escapeHtml(title || "Review conversation")}</h1>
<p class="path">${escapeHtml(file)}</p>
<div class="toolbar">
  <input id="filter" type="search" placeholder="Filter this conversation" autocomplete="off" aria-label="Filter conversation">
  <button class="button" id="copy" type="button">Copy Markdown</button>
  <a class="button" href="/api/${safeKey}/transcript?format=markdown&amp;download=1">Download Markdown</a>
  <a class="button" href="/api/${safeKey}/transcript?download=1">Download JSON</a>
  <a class="button" href="/session/${safeKey}">Open review</a>
</div>
<p id="status" role="status" aria-live="polite"></p>
<section id="entries" aria-label="Conversation"></section>
</main><script>
var KEY = ${JSON.stringify(String(key))};
var entries = [];
var list = document.getElementById("entries");
var filter = document.getElementById("filter");
var status = document.getElementById("status");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function render() {
  var query = filter.value.trim().toLowerCase();
  var visible = entries.filter(function (entry) {
    if (!query) return true;
    return (entry.text + " " + (entry.target || "")).toLowerCase().indexOf(query) !== -1;
  });
  status.textContent = query
    ? visible.length + " of " + entries.length + " entries"
    : entries.length + (entries.length === 1 ? " entry" : " entries");

  if (!visible.length) {
    list.innerHTML = '<div class="empty">' +
      (entries.length ? "Nothing matches that filter." : "This review has no conversation yet.") + "</div>";
    return;
  }

  list.innerHTML = visible.map(function (entry) {
    return '<article class="entry ' + entry.role + '"><div class="who"><span>' +
      (entry.role === "agent" ? "Agent" : "Reviewer") + '</span><span class="when">' +
      escapeHtml(entry.at || "") + "</span></div>" +
      (entry.target ? '<div class="target">' + escapeHtml(entry.target) + "</div>" : "") +
      '<div class="text">' + escapeHtml(entry.text) + "</div></article>";
  }).join("");
}

function load() {
  return fetch("/api/" + encodeURIComponent(KEY) + "/transcript", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      entries = Array.isArray(data.entries) ? data.entries : [];
      render();
    })
    .catch(function (error) {
      status.textContent = "";
      list.innerHTML = '<div class="error">Could not read this conversation: ' + escapeHtml(error.message) + "</div>";
    });
}

filter.addEventListener("input", render);
document.getElementById("copy").addEventListener("click", function () {
  var button = this;
  fetch("/api/" + encodeURIComponent(KEY) + "/transcript?format=markdown", { cache: "no-store" })
    .then(function (response) { return response.text(); })
    .then(function (markdown) { return navigator.clipboard.writeText(markdown); })
    .then(function () {
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = "Copy Markdown"; }, 1600);
    })
    .catch(function () {
      // A clipboard the browser refuses is not a failed export: the download beside this works.
      button.textContent = "Copy blocked - use Download";
      setTimeout(function () { button.textContent = "Copy Markdown"; }, 2600);
    });
});
load();
// A review that is still running keeps writing to this page.
setInterval(load, 10000);
</script></body></html>`;
}

// Server-side escaping for the shell above. The entries themselves are escaped in the browser,
// where they arrive as JSON rather than as markup.
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}
