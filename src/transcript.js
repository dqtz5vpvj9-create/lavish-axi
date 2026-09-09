// The review conversation as a document: everything the reviewer wrote and everything the agent
// replied, in order. The panel is a 360px column that scrolls, which is right for working in and
// wrong for reading back a review that ran for a week - and a review is often the only record of
// why a thing was changed, so it has to be possible to keep it somewhere outside Lavish.

export function transcriptEntries(session) {
  const chat = Array.isArray(session?.chat) ? session.chat : [];
  return chat
    .filter((entry) => entry && typeof entry === "object" && String(entry.text || ""))
    .map((entry) => ({
      role: entry.role === "agent" ? "agent" : "user",
      text: String(entry.text),
      at: String(entry.at || ""),
      ...(entry.target ? { target: String(entry.target) } : {}),
      ...(entry.tag ? { tag: String(entry.tag) } : {}),
    }));
}

export function transcriptDocument(session) {
  return {
    file: String(session?.file || ""),
    status: String(session?.status || "open"),
    ...(session?.ended_by ? { ended_by: String(session.ended_by) } : {}),
    updated_at: String(session?.updated_at || ""),
    pending_prompts: Number(session?.pending_prompts || 0),
    entries: transcriptEntries(session),
  };
}

// Markdown rather than the panel's own markup, because the point of an export is to be readable
// where Lavish is not: a commit message, an issue, a paper's revision notes.
export function transcriptMarkdown(document, { title = "" } = {}) {
  const heading = title || basename(document.file) || "Lavish review";
  const lines = [`# ${heading}`, ""];
  lines.push(`- Artifact: \`${document.file}\``);
  lines.push(`- Status: ${document.status}${document.ended_by ? ` (ended by ${document.ended_by})` : ""}`);
  if (document.updated_at) lines.push(`- Last activity: ${document.updated_at}`);
  lines.push(`- Entries: ${document.entries.length}`);
  if (document.pending_prompts > 0) {
    // Queued feedback is not part of the conversation yet: it has not been sent, and saying so is
    // the difference between an export that is complete and one that only looks complete.
    lines.push(`- Queued and not yet sent: ${document.pending_prompts}`);
  }
  lines.push("");

  for (const entry of document.entries) {
    const who = entry.role === "agent" ? "Agent" : "Reviewer";
    const when = entry.at ? ` · ${entry.at}` : "";
    lines.push(`## ${who}${when}`);
    if (entry.target) lines.push(`> ${entry.target}`);
    lines.push("");
    lines.push(entry.text);
    lines.push("");
  }
  return lines.join("\n");
}

export function transcriptFileName(file, extension) {
  const base = basename(file).replace(/\.html?$/i, "") || "lavish-review";
  return `${base}.transcript.${extension}`;
}

function basename(file) {
  return String(file || "")
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .pop();
}
