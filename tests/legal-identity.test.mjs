import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const pages = [
  "index.html",
  "sobre.html",
  "produtos.html",
  "empresas.html",
  "contato.html",
  "privacidade.html",
  "termos.html",
];

test("every shared site page shows the official CNPJ", async () => {
  for (const page of pages) {
    const html = await readFile(new URL(page, root), "utf8");

    assert.doesNotMatch(html, /00\.000\.000\/0001-99/, `${page} must not show the placeholder CNPJ`);
    assert.match(html, /60\.436\.611\/0001-09/, `${page} must show the official CNPJ`);
  }
});
