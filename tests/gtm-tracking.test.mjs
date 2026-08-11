import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const require = createRequire(import.meta.url);
const flow = require("../js/cotacao.js");

test("landing installs the Miro GTM container in head and body", async () => {
  const html = await read("cotacao.html");

  assert.ok((html.match(/GTM-M5JG9ZFW/g) || []).length >= 2);
  assert.match(html, /<head>\s*<!-- Google Tag Manager -->/);
  assert.match(html, /<body class="lp-mode">\s*<!-- Google Tag Manager \(noscript\) -->/);
});

test("landing delegates Meta events to GTM without a second direct Pixel", async () => {
  const html = await read("cotacao.html");
  const js = await read("js/cotacao.js");

  assert.match(html, /src="js\/cotacao\.js\?v=5"/);
  assert.match(js, /event:\s*["']whatsapp_click["']/);
  assert.match(js, /meta_event_name:\s*["']Contact["']/);
  assert.doesNotMatch(js, /connect\.facebook\.net|\bfbq\b|958971496954944/);
});

test("dataLayer delivery exposes the WhatsApp event to GTM", () => {
  assert.equal(typeof flow.pushDataLayerEvent, "function");

  const dataLayer = [];
  const delivered = flow.pushDataLayerEvent(dataLayer, {
    event: "whatsapp_click",
    meta_event_name: "Contact",
    cta_location: "hero-card",
    utm_source: "meta"
  });

  assert.equal(delivered, true);
  assert.deepEqual(dataLayer, [{
    event: "whatsapp_click",
    meta_event_name: "Contact",
    cta_location: "hero-card",
    utm_source: "meta"
  }]);
});
