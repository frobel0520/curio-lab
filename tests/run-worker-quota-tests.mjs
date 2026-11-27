import assert from "node:assert/strict";
import worker from "../worker/src/index.ts";
import {
  QUOTA_LIMITS,
  canReadImage,
  canUpload,
  dayKey,
  monthKey,
  quotaSnapshot,
} from "../worker/src/quota.ts";

const empty = { uploads: 0, image_reads: 0, bytes_uploaded: 0 };
assert.equal(canUpload(empty, 250_000), true);
assert.equal(canUpload({ ...empty, uploads: QUOTA_LIMITS.uploadsPerMonth }, 1), false);
assert.equal(canUpload({ ...empty, bytes_uploaded: QUOTA_LIMITS.bytesUploadedPerMonth }, 1), false);
assert.equal(canReadImage({ ...empty, image_reads: QUOTA_LIMITS.imageReadsPerMonth }), false);
assert.equal(monthKey(new Date("2026-08-09T00:00:00Z")), "2026-08");
assert.equal(dayKey(new Date("2026-08-09T00:00:00Z")), "2026-08-09");
assert.equal(quotaSnapshot(empty, { uploads: 0, image_reads: 0 }, 0).uploadEnabled, true);

function createFakeEnv() {
  const cards = new Map();
  const oauthStates = new Map();
  const kv = new Map();
  const db = {
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...values) {
          args = values;
          return stmt;
        },
        async run() {
          if (sql.includes("INSERT INTO share_cards")) {
            const [id, object_key, title, caption, return_url, byte_size, created_at, expires_at] = args;
            cards.set(id, { id, object_key, title, caption, return_url, byte_size, created_at, expires_at });
          } else if (sql.includes("INSERT INTO oauth_states")) {
            const [state, share_id, return_url, created_at, expires_at] = args;
            oauthStates.set(state, { state, share_id, return_url, created_at, expires_at });
          } else if (sql.includes("DELETE FROM oauth_states WHERE state")) {
            oauthStates.delete(args[0]);
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (sql.includes("FROM share_cards WHERE id = ?1")) {
            const card = cards.get(args[0]);
            return card && card.expires_at > args[1] ? card : null;
          }
          if (sql.includes("FROM oauth_states WHERE state = ?1")) {
            const row = oauthStates.get(args[0]);
            return row && row.expires_at > args[1] ? row : null;
          }
          return null;
        },
      };
      return stmt;
    },
  };

  return {
    env: {
      DB: db,
      SHARE_CARDS: {
        async put(key, val) { kv.set(key, val); },
        async delete(key) { kv.delete(key); },
      },
      ALLOWED_ORIGINS: "https://www.curio-lab.workers.dev",
      PUBLIC_BASE_URL: "https://api.curio-lab.workers.dev",
      QUOTA_SECRET: "0123456789abcdef0123456789abcdef",
      THREADS_API_BASE: "https://graph.threads.net",
      THREADS_AUTH_URL: "https://threads.net/oauth/authorize",
      THREADS_TOKEN_URL: "https://graph.threads.net/oauth/access_token",
      THREADS_APP_ID: "app-id-123",
      THREADS_APP_SECRET: "super-secret-threads-app-secret",
    },
    oauthStates,
  };
}

// 1. Verify 8-byte PNG magic header enforcement in uploadShareCard
{
  const { env } = createFakeEnv();
  const fakeForm = new FormData();
  fakeForm.set("image", new File([new TextEncoder().encode("not-a-real-png")], "fake.png", { type: "image/png" }));
  fakeForm.set("title", "主子帳本");
  fakeForm.set("caption", "測試文案");
  fakeForm.set("returnUrl", "https://www.curio-lab.workers.dev/tools/cat-cost");

  const rejected = await worker.fetch(
    new Request("https://api.curio-lab.workers.dev/v1/share-cards", {
      method: "POST",
      headers: { origin: "https://www.curio-lab.workers.dev" },
      body: fakeForm,
    }),
    env,
  );
  assert.equal(rejected.status, 400);
  assert.deepEqual(await rejected.json(), { error: "png_required" });

  const validPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const goodForm = new FormData();
  goodForm.set("image", new File([validPng], "real.png", { type: "image/png" }));
  goodForm.set("title", "主子帳本");
  goodForm.set("caption", "測試文案");
  goodForm.set("returnUrl", "https://www.curio-lab.workers.dev/tools/cat-cost");

  const accepted = await worker.fetch(
    new Request("https://api.curio-lab.workers.dev/v1/share-cards", {
      method: "POST",
      headers: { origin: "https://www.curio-lab.workers.dev" },
      body: goodForm,
    }),
    env,
  );
  assert.equal(accepted.status, 201);
  const created = await accepted.json();

  // 2. Verify Threads OAuth cookie binding and non-URL secret/token transport
  const startRes = await worker.fetch(
    new Request(`https://api.curio-lab.workers.dev/v1/threads/start?shareId=${encodeURIComponent(created.id)}`),
    env,
  );
  assert.equal(startRes.status, 302);
  const setCookie = startRes.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /^__Host-curio_threads_state=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Path=\//);
  assert.match(setCookie, /Max-Age=600/);

  const state = new URL(startRes.headers.get("location")).searchParams.get("state");
  const cookiePair = setCookie.split(";")[0];

  // Missing cookie -> 400 without consuming state or calling Threads
  const noCookieRes = await worker.fetch(
    new Request(`https://api.curio-lab.workers.dev/v1/threads/callback?state=${encodeURIComponent(state)}&code=auth-code`),
    env,
  );
  assert.equal(noCookieRes.status, 400);

  // Valid cookie -> exchanges token via POST body and calls Threads with Authorization: Bearer
  const outboundCalls = [];
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const reqUrl = String(input);
    outboundCalls.push({ url: reqUrl, headers: new Headers(init?.headers), body: String(init?.body ?? "") });
    if (reqUrl.endsWith("/oauth/access_token")) {
      return new Response(JSON.stringify({ access_token: "threads-secret-access-token" }), { status: 200 });
    }
    if (reqUrl.endsWith("/me/threads")) {
      return new Response(JSON.stringify({ id: "container-123" }), { status: 200 });
    }
    return new Response(JSON.stringify({ id: "post-456" }), { status: 200 });
  };

  try {
    const okCallback = await worker.fetch(
      new Request(`https://api.curio-lab.workers.dev/v1/threads/callback?state=${encodeURIComponent(state)}&code=auth-code`, {
        headers: { cookie: cookiePair },
      }),
      env,
    );
    assert.equal(okCallback.status, 302);
    assert.match(okCallback.headers.get("set-cookie") ?? "", /Max-Age=0/);
    assert.equal(outboundCalls.length, 3);
    for (const call of outboundCalls) {
      assert.ok(!call.url.includes("client_secret="), `URL leaked client_secret: ${call.url}`);
      assert.ok(!call.url.includes("access_token="), `URL leaked access_token: ${call.url}`);
    }
    assert.match(outboundCalls[0].body, /client_secret=super-secret-threads-app-secret/);
    assert.equal(outboundCalls[1].headers.get("authorization"), "Bearer threads-secret-access-token");
    assert.equal(outboundCalls[2].headers.get("authorization"), "Bearer threads-secret-access-token");
  } finally {
    globalThis.fetch = origFetch;
  }
}

console.log("worker quota + security: all assertions passed");
