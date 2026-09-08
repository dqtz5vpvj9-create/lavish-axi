import assert from "node:assert/strict";
import test from "node:test";

import { injectLavishSdk, injectLavishStorage } from "../src/html-transform.js";

test("injects the Lavish SDK before the closing body tag", () => {
  const html = "<!doctype html><html><body><h1>Hi</h1></body></html>";
  const result = injectLavishSdk(html, "abc123");

  assert.match(result, /<script src="\/sdk\.js\?key=abc123"><\/script><\/body>/);
});

test("does not inject Tailwind or DaisyUI design assets so the saved file stays portable", () => {
  const html = '<!doctype html><html><head><title>Hi</title></head><body><h1 class="btn">Hi</h1></body></html>';
  const result = injectLavishSdk(html, "abc123");

  assert.doesNotMatch(result, /\/design\/daisyui\.css/);
  assert.doesNotMatch(result, /\/design\/daisyui-themes\.css/);
  assert.doesNotMatch(result, /\/design\/tailwindcss-browser\.js/);
  assert.doesNotMatch(result, /data-lavish-design/);
});

test("leaves the <head> untouched - only the SDK script is appended at end of body", () => {
  const html = "<!doctype html><html><head><title>Hi</title></head><body><h1>Hi</h1></body></html>";
  const result = injectLavishSdk(html, "abc123");

  assert.equal(
    result,
    '<!doctype html><html><head><title>Hi</title></head><body><h1>Hi</h1><script src="/sdk.js?key=abc123"></script></body></html>',
  );
});

test("appends the Lavish SDK when the artifact has no body tag", () => {
  const result = injectLavishSdk("<h1>Hi</h1>", "abc123");

  assert.equal(result, '<h1>Hi</h1>\n<script src="/sdk.js?key=abc123"></script>');
});

test("carries the per-load token into the SDK request", () => {
  const result = injectLavishSdk("<body></body>", "abc123", 7, "load token/7");

  assert.match(result, /sdk\.js\?key=abc123&artifact_revision=7&artifact_load_token=load%20token%2F7/);
});

test("the storage shim runs before the artifact's own scripts", () => {
  const html =
    '<!doctype html><html><head><title>Review</title></head><body><script>localStorage.getItem("x")</script></body></html>';
  const result = injectLavishStorage(html, { x: "1" });

  // The page reads its state while it boots, so a shim placed after that read is no shim at all.
  assert.ok(result.indexOf("lavish:storageWrite") < result.indexOf('localStorage.getItem("x")'));
  assert.match(result, /<head><script>/);
});

test("the seed cannot close the script tag it rides in", () => {
  const result = injectLavishStorage("<html><head></head><body></body></html>", {
    note: "</script><script>alert(1)</script>",
  });

  // The value is the artifact's own data, but it reaches the page inside a script tag: a review
  // page that stores something a reviewer typed must not be able to smuggle markup out of it.
  assert.doesNotMatch(result, /<\/script><script>alert/);
  assert.match(result, /\\u003c\/script>/);
});

test("a page with no head still gets the shim first", () => {
  const result = injectLavishStorage("<p>bare</p>", {});

  assert.ok(result.startsWith("<script>"));
  assert.ok(result.endsWith("<p>bare</p>"));
});

test("the shim steps aside when the document has a real localStorage", () => {
  const result = injectLavishStorage("<html><head></head><body></body></html>", {});

  // Reached only outside the sandbox; there the browser's own store is the right one.
  assert.match(result, /window\.localStorage\.getItem\("lavish-axi:probe"\);return/);
});
