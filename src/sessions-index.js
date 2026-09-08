// The server's front page: every review this Lavish knows about, newest first. An agent prints one
// session URL and moves on, so without this the only index of open reviews is whatever links the
// user managed to keep, and a review nobody kept a link to is effectively lost while still running.
// The chrome's brand mark links here, which is the way back from any single review.
export function createSessionsIndexHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lavish sessions</title><style>
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
  --sage: #8fe39e;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-pill: 999px;
  --font-sans: Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: var(--bg); color: var(--fg); font: 14px/1.45 var(--font-sans); }
button, input { font: inherit; color: inherit; }
a { color: inherit; text-decoration: none; }
.shell { width: min(1100px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 64px; }
header { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
.brand { display: flex; align-items: baseline; gap: 8px; }
.brand-mark { font-size: 22px; font-weight: 750; letter-spacing: 0.02em; color: var(--accent); }
.brand-support { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-label); }
.counts { display: flex; gap: 8px; }
.count { min-width: 96px; padding: 8px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-panel); }
.count strong { display: block; font-size: 20px; font-weight: 700; }
.count span { color: var(--fg-label); font-size: 12px; }
.toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
#search { flex: 1 1 auto; min-width: 0; padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-panel); outline: none; }
#search:focus { border-color: var(--accent); }
.toggle { display: flex; gap: 6px; align-items: center; padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-panel); color: var(--fg-faint); cursor: pointer; white-space: nowrap; }
.toggle[aria-pressed="true"] { color: var(--fg); border-color: var(--border-strong); }
#status { min-height: 20px; margin: 0 0 12px; color: var(--fg-label); font-size: 12px; }
.list { display: grid; gap: 10px; }
.session { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-panel); }
.session:hover { border-color: var(--border-strong); }
.session.is-ended { opacity: 0.62; }
.identity { min-width: 0; }
.title-row { display: flex; gap: 8px; align-items: center; min-width: 0; }
.title { margin: 0; overflow: hidden; font-size: 16px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.badge { flex: none; padding: 2px 8px; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); color: var(--fg-faint); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.badge.feedback { color: var(--accent); border-color: #5d4d1b; }
.badge.open { color: var(--sage); border-color: #315f3a; }
.meta { display: flex; gap: 6px 14px; flex-wrap: wrap; margin-top: 6px; color: var(--fg-label); font-size: 12px; }
.project { color: var(--fg-muted); }
.path { max-width: 100%; overflow: hidden; font-family: var(--font-mono); text-overflow: ellipsis; white-space: nowrap; }
.actions { display: flex; gap: 8px; }
.button { display: inline-flex; align-items: center; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-elevated); cursor: pointer; white-space: nowrap; }
.button:hover { border-color: var(--border-strong); }
.button.primary { color: var(--accent-ink); border-color: var(--accent); background: var(--accent); font-weight: 700; }
.empty, .error { padding: 40px 20px; border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--fg-label); text-align: center; }
.error { border-style: solid; border-color: #5d2b2b; color: #f0b5ab; }
footer { margin-top: 20px; color: var(--fg-label); font-size: 12px; text-align: center; }
@media (max-width: 720px) {
  .session { grid-template-columns: minmax(0, 1fr); }
  .actions .button { flex: 1 1 auto; justify-content: center; }
}
</style></head><body><main class="shell">
<header>
  <div class="brand"><span class="brand-mark">Lavish</span><span class="brand-support">Sessions</span></div>
  <div class="counts">
    <div class="count"><strong id="countActive">-</strong><span>active reviews</span></div>
    <div class="count"><strong id="countPending">-</strong><span>queued feedback</span></div>
  </div>
</header>
<div class="toolbar">
  <input id="search" type="search" placeholder="Filter by title, project, or path" autocomplete="off" aria-label="Filter sessions">
  <button class="toggle" id="showEnded" type="button" aria-pressed="false">Show ended</button>
</div>
<p id="status" role="status" aria-live="polite"></p>
<section class="list" id="list" aria-label="Review sessions"></section>
<footer>Refreshes every 5 seconds</footer>
</main><script>
var sessions = [];
var showEnded = false;
var list = document.getElementById("list");
var search = document.getElementById("search");
var status = document.getElementById("status");
var endedToggle = document.getElementById("showEnded");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

// Absolute time is what makes a stale review recognisable, but "which of these did I touch just
// now" is the actual question, so lead with the age.
function age(value) {
  var ms = Date.now() - Date.parse(value);
  if (!(ms >= 0)) return "";
  var minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + "m ago";
  var hours = Math.round(minutes / 60);
  if (hours < 48) return hours + "h ago";
  return Math.round(hours / 24) + "d ago";
}

function render() {
  var query = search.value.trim().toLowerCase();
  var visible = sessions.filter(function (session) {
    if (!showEnded && session.status === "ended") return false;
    if (!query) return true;
    return [session.title, session.project, session.file].some(function (value) {
      return String(value).toLowerCase().indexOf(query) !== -1;
    });
  });
  var active = sessions.filter(function (session) { return session.status !== "ended"; });
  document.getElementById("countActive").textContent = active.length;
  document.getElementById("countPending").textContent = active.reduce(function (sum, session) {
    return sum + (session.pending_prompts || 0);
  }, 0);
  status.textContent = query ? visible.length + " of " + sessions.length + " sessions" : "";

  if (!visible.length) {
    list.innerHTML = '<div class="empty">' +
      (sessions.length ? "Nothing matches that filter." : "No reviews yet. Open one with <code>lavish-axi &lt;html-file&gt;</code>.") +
      "</div>";
    return;
  }

  list.innerHTML = visible.map(function (session) {
    var badge = session.status === "feedback" ? "feedback" : session.status === "ended" ? "" : "open";
    return '<article class="session' + (session.status === "ended" ? " is-ended" : "") + '">' +
      '<div class="identity"><div class="title-row"><h2 class="title" title="' + escapeHtml(session.title) + '">' +
      escapeHtml(session.title) + '</h2><span class="badge ' + badge + '">' + escapeHtml(session.status) + "</span></div>" +
      '<div class="meta"><span class="project">' + escapeHtml(session.project) + "</span>" +
      "<span>" + escapeHtml(age(session.updated_at)) + "</span>" +
      (session.pending_prompts ? "<span>" + session.pending_prompts + " queued</span>" : "") +
      '<span class="path" title="' + escapeHtml(session.file) + '">' + escapeHtml(session.file) + "</span></div></div>" +
      '<div class="actions"><a class="button" href="/artifact/' + encodeURIComponent(session.key) +
      '/source.html" target="_blank" rel="noopener">Artifact only</a>' +
      '<a class="button primary" href="/session/' + encodeURIComponent(session.key) +
      '" target="_blank" rel="noopener">Open review</a></div></article>';
  }).join("");
}

function refresh() {
  return fetch("/api/sessions", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      sessions = Array.isArray(data.sessions) ? data.sessions : [];
      render();
    })
    .catch(function (error) {
      status.textContent = "";
      list.innerHTML = '<div class="error">Could not read sessions: ' + escapeHtml(error.message) + "</div>";
    });
}

search.addEventListener("input", render);
endedToggle.addEventListener("click", function () {
  showEnded = !showEnded;
  endedToggle.setAttribute("aria-pressed", showEnded ? "true" : "false");
  render();
});
refresh();
setInterval(refresh, 5000);
</script></body></html>`;
}
