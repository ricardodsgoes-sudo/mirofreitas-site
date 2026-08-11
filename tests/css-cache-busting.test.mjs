import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("cotacao page fingerprints its landing stylesheet", async () => {
  const html = await readFile(new URL("cotacao.html", root), "utf8");

  assert.match(html, /href="css\/cotacao\.css\?v=5"/);
});
