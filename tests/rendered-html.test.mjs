import assert from "node:assert/strict";
import test from "node:test";

test("renders destination content and metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>2026 日本国庆｜目的地候选<\/title>/);
  assert.match(html, /<h1>名古屋 → 立山黑部<\/h1>/);
  assert.match(html, /<h2>上高地<\/h2>/);
  assert.match(html, /等待全部候选目的地资料齐备后统一生成/);
});
