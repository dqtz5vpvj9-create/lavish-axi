// The artifact iframe is sandboxed without `allow-same-origin`, which is what keeps a review
// page from reaching this server's cookies, its DOM, or the rest of the machine's origins. The
// cost is an opaque origin, where `window.localStorage` throws on ACCESS rather than behaving
// like an empty store - so a page that keeps its own review state cannot even feature-detect
// its way out, and typically reports the loss to the user ("local saving unavailable").
//
// This restores the API without opening the sandbox: a same-shaped store, seeded server-side
// with what this session already holds, that mirrors writes to the chrome, which is
// same-origin and does the PUT. Reads stay synchronous because the seed is inline. When the
// browser does give the document a real localStorage - a standalone or exported copy, which
// never carries this script anyway - the shim steps aside.
//
// sessionStorage is shimmed in memory only. Persisting it would outlive the tab, which is the
// one thing its semantics promise not to do.
export function injectLavishStorage(html, entries) {
  const seed = JSON.stringify(entries && typeof entries === "object" ? entries : {}).replace(/</g, "\\u003c");
  const script = `<script>(function(){var seed=${seed};function store(initial,persist){var map=new Map(Object.entries(initial||{}));var timer=null;function flush(){timer=null;if(!persist)return;try{parent.postMessage({type:"lavish:storageWrite",entries:Object.fromEntries(map)},"*")}catch(e){}}function changed(){if(timer===null)timer=setTimeout(flush,150)}var api={getItem:function(k){k=String(k);return map.has(k)?map.get(k):null},setItem:function(k,v){map.set(String(k),String(v));changed()},removeItem:function(k){map.delete(String(k));changed()},clear:function(){map.clear();changed()},key:function(i){var keys=Array.from(map.keys());return i<keys.length?keys[i]:null}};Object.defineProperty(api,"length",{get:function(){return map.size}});return api}try{window.localStorage.getItem("lavish-axi:probe");return}catch(e){}try{Object.defineProperty(window,"localStorage",{configurable:true,value:store(seed,true)});Object.defineProperty(window,"sessionStorage",{configurable:true,value:store({},false)})}catch(e){}})();</script>`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${script}`);
  }
  // No head to lead with: the shim still has to run before the page's own scripts.
  return `${script}${html}`;
}

export function injectLavishSdk(html, key, artifactRevision, artifactLoadToken = "") {
  const revisionNumber = Number(artifactRevision);
  const revision = Number.isFinite(revisionNumber) && revisionNumber >= 0 ? Math.trunc(revisionNumber) : null;
  const revisionQuery = revision === null ? "" : `&artifact_revision=${revision}`;
  const token = String(artifactLoadToken || "").slice(0, 200);
  const tokenQuery = token ? `&artifact_load_token=${encodeURIComponent(token)}` : "";
  const script = `<script src="/sdk.js?key=${encodeURIComponent(key)}${revisionQuery}${tokenQuery}"></script>`;
  if (/<\/body\s*>/i.test(html)) {
    return html.replace(/<\/body\s*>/i, `${script}</body>`);
  }
  return `${html}\n${script}`;
}
