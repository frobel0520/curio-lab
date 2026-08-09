import { QUOTA_LIMITS, dayKey, monthKey, quotaSnapshot, type DailyUsage, type Usage } from "./quota";

interface Env {
  DB: D1Database;
  SHARE_CARDS: KVNamespace;
  ALLOWED_ORIGINS: string;
  PUBLIC_BASE_URL: string;
  QUOTA_SECRET: string;
  THREADS_API_BASE: string;
  THREADS_AUTH_URL: string;
  THREADS_TOKEN_URL: string;
  THREADS_APP_ID: string;
  THREADS_APP_SECRET?: string;
}

type ShareCardRow = {
  id: string;
  object_key: string;
  title: string;
  caption: string;
  return_url: string;
  expires_at: number;
};

const defaultUsage = (): Usage => ({ uploads: 0, image_reads: 0, bytes_uploaded: 0 });

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function allowedOrigins(env: Env) {
  return env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("origin") ?? "";
  const headers = new Headers({
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  });
  if (allowedOrigins(env).includes(origin)) headers.set("access-control-allow-origin", origin);
  return headers;
}

function withCors(response: Response, request: Request, env: Env) {
  const headers = new Headers(response.headers);
  corsHeaders(request, env).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function isAllowedWrite(request: Request, env: Env) {
  const origin = request.headers.get("origin") ?? "";
  return allowedOrigins(env).includes(origin);
}

function randomToken(bytes = 18) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return btoa(String.fromCharCode(...data)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function validToken(value: string) {
  return /^[A-Za-z0-9_-]{20,40}$/.test(value);
}

function publicBase(env: Env) {
  return env.PUBLIC_BASE_URL.replace(/\/$/, "");
}

function safeText(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

async function ensureUsageRow(env: Env, month: string) {
  await env.DB.prepare(
    "INSERT INTO usage_months (month) VALUES (?1) ON CONFLICT(month) DO NOTHING",
  ).bind(month).run();
}

async function getUsage(env: Env, month: string) {
  await ensureUsageRow(env, month);
  return await env.DB.prepare(
    "SELECT uploads, image_reads, bytes_uploaded FROM usage_months WHERE month = ?1",
  ).bind(month).first<Usage>() ?? defaultUsage();
}

async function ensureDailyUsageRow(env: Env, day: string) {
  await env.DB.prepare(
    "INSERT INTO usage_days (day) VALUES (?1) ON CONFLICT(day) DO NOTHING",
  ).bind(day).run();
}

async function getDailyUsage(env: Env, day: string) {
  await ensureDailyUsageRow(env, day);
  return await env.DB.prepare(
    "SELECT uploads, image_reads FROM usage_days WHERE day = ?1",
  ).bind(day).first<DailyUsage>() ?? { uploads: 0, image_reads: 0 };
}

async function getBytesLive(env: Env) {
  return (await env.DB.prepare("SELECT bytes_live FROM storage_usage WHERE id = 1")
    .first<{ bytes_live: number }>())?.bytes_live ?? 0;
}

async function hashClient(request: Request, env: Env) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const secret = env.QUOTA_SECRET || "local-development-only";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function reserveClientUpload(request: Request, env: Env) {
  const day = new Date().toISOString().slice(0, 10);
  const clientHash = await hashClient(request, env);
  await env.DB.prepare(
    "INSERT INTO upload_clients (day, client_hash) VALUES (?1, ?2) ON CONFLICT(day, client_hash) DO NOTHING",
  ).bind(day, clientHash).run();
  const result = await env.DB.prepare(
    "UPDATE upload_clients SET uploads = uploads + 1 WHERE day = ?1 AND client_hash = ?2 AND uploads < ?3",
  ).bind(day, clientHash, QUOTA_LIMITS.uploadsPerClientPerDay).run();
  return result.meta.changes === 1;
}

async function reserveMonthlyUpload(env: Env, imageBytes: number) {
  const month = monthKey();
  await ensureUsageRow(env, month);
  const result = await env.DB.prepare(`
    UPDATE usage_months
    SET uploads = uploads + 1, bytes_uploaded = bytes_uploaded + ?2
    WHERE month = ?1
      AND uploads < ?3
      AND bytes_uploaded + ?2 <= ?4
  `).bind(
    month,
    imageBytes,
    QUOTA_LIMITS.uploadsPerMonth,
    QUOTA_LIMITS.bytesUploadedPerMonth,
  ).run();
  return result.meta.changes === 1;
}

async function reserveDailyUpload(env: Env) {
  const day = dayKey();
  await ensureDailyUsageRow(env, day);
  const result = await env.DB.prepare(`
    UPDATE usage_days SET uploads = uploads + 1
    WHERE day = ?1 AND uploads < ?2
  `).bind(day, QUOTA_LIMITS.uploadsPerDay).run();
  return result.meta.changes === 1;
}

async function reserveStorage(env: Env, imageBytes: number) {
  const result = await env.DB.prepare(`
    UPDATE storage_usage SET bytes_live = bytes_live + ?1
    WHERE id = 1 AND bytes_live + ?1 <= ?2
  `).bind(imageBytes, QUOTA_LIMITS.liveStorageBytes).run();
  return result.meta.changes === 1;
}

async function reserveImageRead(env: Env) {
  const month = monthKey();
  const day = dayKey();
  await ensureUsageRow(env, month);
  await ensureDailyUsageRow(env, day);
  const monthlyResult = await env.DB.prepare(`
    UPDATE usage_months SET image_reads = image_reads + 1
    WHERE month = ?1 AND image_reads < ?2
  `).bind(month, QUOTA_LIMITS.imageReadsPerMonth).run();
  if (monthlyResult.meta.changes !== 1) return false;
  const dailyResult = await env.DB.prepare(`
    UPDATE usage_days SET image_reads = image_reads + 1
    WHERE day = ?1 AND image_reads < ?2
  `).bind(day, QUOTA_LIMITS.imageReadsPerDay).run();
  return dailyResult.meta.changes === 1;
}

function validReturnUrl(value: string, env: Env) {
  try {
    return allowedOrigins(env).includes(new URL(value).origin);
  } catch {
    return false;
  }
}

async function uploadShareCard(request: Request, env: Env) {
  if (!isAllowedWrite(request, env)) return json({ error: "origin_not_allowed" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return json({ error: "multipart_form_required" }, { status: 415 });
  }

  const form = await request.formData();
  const image = form.get("image");
  const title = safeText(form.get("title"), 100);
  const caption = safeText(form.get("caption"), 500);
  const returnUrl = safeText(form.get("returnUrl"), 500);

  if (!(image instanceof File) || image.type !== "image/png" || image.size < 1) {
    return json({ error: "png_required" }, { status: 400 });
  }
  if (image.size > QUOTA_LIMITS.maxImageBytes) {
    return json({ error: "image_too_large", maxBytes: QUOTA_LIMITS.maxImageBytes }, { status: 413 });
  }
  if (!title || !caption || !validReturnUrl(returnUrl, env)) {
    return json({ error: "invalid_metadata" }, { status: 400 });
  }
  if (!await reserveClientUpload(request, env)) {
    return json({ error: "daily_client_limit_reached", fallback: true }, { status: 429 });
  }
  if (!await reserveMonthlyUpload(env, image.size)) {
    return json({ error: "free_quota_guard_active", fallback: true }, { status: 503 });
  }
  if (!await reserveDailyUpload(env) || !await reserveStorage(env, image.size)) {
    return json({ error: "free_daily_or_storage_guard_active", fallback: true }, { status: 503 });
  }

  const id = randomToken();
  const objectKey = `cards/${id}.png`;
  const now = Date.now();
  const expiresAt = now + QUOTA_LIMITS.retentionDays * 86_400_000;

  try {
    await env.SHARE_CARDS.put(objectKey, image.stream(), { expirationTtl: QUOTA_LIMITS.retentionDays * 86_400 });
    await env.DB.prepare(`
      INSERT INTO share_cards
        (id, object_key, title, caption, return_url, byte_size, created_at, expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `).bind(id, objectKey, title, caption, returnUrl, image.size, now, expiresAt).run();
  } catch (error) {
    await env.SHARE_CARDS.delete(objectKey);
    await env.DB.prepare("UPDATE storage_usage SET bytes_live = MAX(0, bytes_live - ?1) WHERE id = 1")
      .bind(image.size).run();
    throw error;
  }

  const base = publicBase(env);
  return json({
    id,
    shareUrl: `${base}/s/${id}`,
    imageUrl: `${base}/i/${id}.png`,
    expiresAt: new Date(expiresAt).toISOString(),
    capabilities: { threadsOAuth: Boolean(env.THREADS_AUTH_URL && env.THREADS_APP_ID && env.THREADS_APP_SECRET) },
  }, { status: 201 });
}

async function findShareCard(env: Env, id: string) {
  if (!validToken(id)) return null;
  return env.DB.prepare(`
    SELECT id, object_key, title, caption, return_url, expires_at
    FROM share_cards WHERE id = ?1 AND expires_at > ?2
  `).bind(id, Date.now()).first<ShareCardRow>();
}

async function serveImage(env: Env, id: string) {
  const card = await findShareCard(env, id);
  if (!card) return new Response("Not found", { status: 404 });
  if (!await reserveImageRead(env)) {
    return new Response("Free quota guard active", { status: 503, headers: { "retry-after": "86400" } });
  }
  const object = await env.SHARE_CARDS.get(card.object_key, "arrayBuffer");
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers({ "content-type": "image/png" });
  headers.set("etag", `\"${card.id}\"`);
  headers.set("cache-control", "public, max-age=3600, stale-if-error=86400");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object, { headers });
}

async function serveSharePage(env: Env, id: string) {
  const card = await findShareCard(env, id);
  if (!card) return new Response("This shared result has expired.", { status: 404 });
  const base = publicBase(env);
  const title = escapeHtml(card.title);
  const caption = escapeHtml(card.caption);
  const imageUrl = `${base}/i/${card.id}.png`;
  const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}｜好奇一下 Curio Lab</title><meta name="description" content="${caption}">
<meta property="og:type" content="website"><meta property="og:title" content="${title}">
<meta property="og:description" content="${caption}"><meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1080"><meta property="og:image:height" content="1350">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageUrl}">
<style>body{margin:0;background:#f5f0e6;color:#241c15;font-family:system-ui,sans-serif}main{width:min(92vw,520px);margin:40px auto 72px}img{display:block;width:100%;border:1px solid #d8cdbb}a{display:block;margin-top:18px;padding:15px;text-align:center;color:#fff;background:#8f412c;text-decoration:none;border-radius:10px;font-weight:700}p{color:#6e685e;line-height:1.7}</style></head>
<body><main><img src="${imageUrl}" alt="${title}"><p>${caption}</p><a href="${escapeHtml(card.return_url)}">換你算算看</a></main></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function oauthConfigured(env: Env) {
  return Boolean(env.THREADS_AUTH_URL && env.THREADS_TOKEN_URL && env.THREADS_APP_ID && env.THREADS_APP_SECRET);
}

async function startThreadsOAuth(request: Request, env: Env) {
  if (!oauthConfigured(env)) return json({ error: "threads_oauth_not_configured", fallback: true }, { status: 503 });
  const url = new URL(request.url);
  const shareId = url.searchParams.get("shareId") ?? "";
  const card = await findShareCard(env, shareId);
  if (!card) return json({ error: "share_not_found" }, { status: 404 });
  const state = randomToken(24);
  const callbackUrl = `${publicBase(env)}/v1/threads/callback`;
  await env.DB.prepare(`
    INSERT INTO oauth_states (state, share_id, return_url, created_at, expires_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(state, card.id, card.return_url, Date.now(), Date.now() + 600_000).run();
  const authorizationUrl = new URL(env.THREADS_AUTH_URL);
  authorizationUrl.searchParams.set("client_id", env.THREADS_APP_ID);
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizationUrl.searchParams.set("scope", "threads_basic,threads_content_publish");
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("state", state);
  return Response.redirect(authorizationUrl.toString(), 302);
}

async function threadsCallback(request: Request, env: Env) {
  if (!oauthConfigured(env)) return new Response("Threads OAuth is not configured.", { status: 503 });
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const oauthState = await env.DB.prepare(`
    SELECT state, share_id, return_url FROM oauth_states WHERE state = ?1 AND expires_at > ?2
  `).bind(state, Date.now()).first<{ state: string; share_id: string; return_url: string }>();
  if (!oauthState || !code) return new Response("Invalid or expired authorization.", { status: 400 });
  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?1").bind(state).run();
  const card = await findShareCard(env, oauthState.share_id);
  if (!card) return new Response("Shared result expired.", { status: 404 });

  const callbackUrl = `${publicBase(env)}/v1/threads/callback`;
  const tokenUrl = new URL(env.THREADS_TOKEN_URL);
  tokenUrl.searchParams.set("client_id", env.THREADS_APP_ID);
  tokenUrl.searchParams.set("client_secret", env.THREADS_APP_SECRET!);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("grant_type", "authorization_code");
  tokenUrl.searchParams.set("redirect_uri", callbackUrl);
  const tokenResponse = await fetch(tokenUrl, { method: "POST" });
  const tokenData = await tokenResponse.json<{ access_token?: string; error?: unknown }>();
  if (!tokenResponse.ok || !tokenData.access_token) return new Response("Threads authorization failed.", { status: 502 });

  const apiBase = env.THREADS_API_BASE.replace(/\/$/, "");
  const containerUrl = new URL(`${apiBase}/me/threads`);
  containerUrl.searchParams.set("media_type", "IMAGE");
  containerUrl.searchParams.set("image_url", `${publicBase(env)}/i/${card.id}.png`);
  containerUrl.searchParams.set("text", `${card.caption} ${card.return_url}`);
  containerUrl.searchParams.set("alt_text", card.title);
  containerUrl.searchParams.set("access_token", tokenData.access_token);
  const containerResponse = await fetch(containerUrl, { method: "POST" });
  const container = await containerResponse.json<{ id?: string }>();
  if (!containerResponse.ok || !container.id) return new Response("Threads media creation failed.", { status: 502 });

  const publishUrl = new URL(`${apiBase}/me/threads_publish`);
  publishUrl.searchParams.set("creation_id", container.id);
  publishUrl.searchParams.set("access_token", tokenData.access_token);
  const publishResponse = await fetch(publishUrl, { method: "POST" });
  if (!publishResponse.ok) return new Response("Threads publishing failed.", { status: 502 });
  const returnUrl = new URL(oauthState.return_url);
  returnUrl.searchParams.set("threads", "published");
  return Response.redirect(returnUrl.toString(), 302);
}

async function handleRequest(request: Request, env: Env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS" && url.pathname.startsWith("/v1/")) {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true });
  if (request.method === "GET" && url.pathname === "/v1/status") {
    const [usage, daily, bytesLive] = await Promise.all([
      getUsage(env, monthKey()),
      getDailyUsage(env, dayKey()),
      getBytesLive(env),
    ]);
    return withCors(json({ ...quotaSnapshot(usage, daily, bytesLive), threadsOAuth: oauthConfigured(env) }), request, env);
  }
  if (request.method === "POST" && url.pathname === "/v1/share-cards") {
    return withCors(await uploadShareCard(request, env), request, env);
  }
  const imageMatch = url.pathname.match(/^\/i\/([A-Za-z0-9_-]{20,40})\.png$/);
  if (request.method === "GET" && imageMatch) return serveImage(env, imageMatch[1]);
  const shareMatch = url.pathname.match(/^\/s\/([A-Za-z0-9_-]{20,40})$/);
  if (request.method === "GET" && shareMatch) return serveSharePage(env, shareMatch[1]);
  if (request.method === "GET" && url.pathname === "/v1/threads/start") return startThreadsOAuth(request, env);
  if (request.method === "GET" && url.pathname === "/v1/threads/callback") return threadsCallback(request, env);
  return json({ error: "not_found" }, { status: 404 });
}

async function cleanup(env: Env) {
  const expired = await env.DB.prepare(
    "SELECT id, object_key, byte_size FROM share_cards WHERE expires_at <= ?1 LIMIT 500",
  ).bind(Date.now()).all<{ id: string; object_key: string; byte_size: number }>();
  const rows = expired.results ?? [];
  for (let index = 0; index < rows.length; index += 50) {
    await Promise.all(rows.slice(index, index + 50).map((row) => env.SHARE_CARDS.delete(row.object_key)));
  }
  if (rows.length) {
    const expiredBytes = rows.reduce((sum, row) => sum + row.byte_size, 0);
    await env.DB.batch([
      ...rows.map((row) => env.DB.prepare("DELETE FROM share_cards WHERE id = ?1").bind(row.id)),
      env.DB.prepare("UPDATE storage_usage SET bytes_live = MAX(0, bytes_live - ?1) WHERE id = 1").bind(expiredBytes),
    ]);
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM oauth_states WHERE expires_at <= ?1").bind(Date.now()),
    env.DB.prepare("DELETE FROM upload_clients WHERE day < ?1").bind(new Date(Date.now() - 172_800_000).toISOString().slice(0, 10)),
  ]);
}

export default {
  fetch(request: Request, env: Env) {
    return handleRequest(request, env).catch(() => json({ error: "internal_error", fallback: true }, { status: 500 }));
  },
  scheduled(_controller: ScheduledController, env: Env, context: ExecutionContext) {
    context.waitUntil(cleanup(env));
  },
} satisfies ExportedHandler<Env>;
