# Curio Lab share Worker

This Worker creates seven-day public result links using Workers KV and D1, without enabling R2 billing. When a guard is reached, `POST /v1/share-cards` or image reads return an error and the web app falls back to local sharing.

## Guardrails

- 500 uploaded cards per day and 10,000 per month.
- 50,000 image reads per day and 1,000,000 per month.
- 1 GB uploaded per month and 500 MB maximum tracked live storage.
- Five uploads per hashed client IP per day; raw IP addresses are not stored.
- Maximum PNG size: 1.5 MB. Cards expire after seven days.

These application limits sit below Workers KV's free daily limits. KV also rejects operations after its free limits are reached instead of billing an overage.

## Local verification

1. Run `npm run worker:migrate:local`.
2. Run `npm run worker:dev`.
3. The health endpoint is `http://127.0.0.1:8787/health`.
4. Run `npm run worker:check` for a deployment dry run.

## Provision production resources

1. Run `npx wrangler login`.
2. Run `npx wrangler d1 create curio-lab-share --location apac` and replace the placeholder `database_id` in `wrangler.jsonc`.
3. Run `npx wrangler kv namespace create curio-lab-share-cards` and place its ID in the `SHARE_CARDS` binding.
4. Update `ALLOWED_ORIGINS` and `PUBLIC_BASE_URL`, then apply migrations with `npx wrangler d1 migrations apply curio-lab-share --remote --config worker/wrangler.jsonc`.
5. Set `QUOTA_SECRET` using `npx wrangler secret put QUOTA_SECRET --config worker/wrangler.jsonc`, then deploy with `npx wrangler deploy --config worker/wrangler.jsonc`.

After the first deploy confirms the final Worker URL, update `PUBLIC_BASE_URL` and deploy again. Set the website build variable `NEXT_PUBLIC_SHARE_API_URL` to the same URL.

## Retention

Every KV value is written with a seven-day TTL. The scheduled Worker also removes expired D1 metadata and reconciles tracked live bytes daily.

## Threads OAuth

The Worker implements one-time authorization: it stores a ten-minute state, exchanges the code, publishes the image post, and does not persist the access token.

Before enabling it:

1. Create a Meta app with the Threads use case and register `PUBLIC_BASE_URL/v1/threads/callback`.
2. Set the verified authorization URL in `THREADS_AUTH_URL` and the Threads App ID in `THREADS_APP_ID`.
3. Set `THREADS_APP_SECRET` with `wrangler secret put`.
4. Keep `THREADS_AUTH_URL` blank until Meta configuration is complete; the frontend will continue using native sharing.
