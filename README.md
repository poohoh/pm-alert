# pm-alert

Cloudflare Worker project for daily PM alerts from AirKorea, with ntfy push notifications and a small status dashboard.

## What it does

- Pulls the latest PM10 and PM2.5 reading for a single AirKorea station
- Sends a daily ntfy summary notification with PM10 and PM2.5 grades
- Runs automatically on a Cloudflare Cron schedule
- Exposes a simple dashboard at `/` and live JSON at `/api/status`

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Fill in these values in `.dev.vars`:

   - `AIRKOREA_SERVICE_KEY`
   - `NTFY_TOPIC`
   - `ADMIN_TOKEN` if you want to protect manual runs

4. Start the Worker locally:

   ```bash
   npm run dev
   ```

## Routes

- `GET /` renders a dashboard without sending notifications
- `GET /api/status` returns the live check result as JSON
- `GET` or `POST /api/run` triggers a manual run and sends the daily summary notification

If `ADMIN_TOKEN` is set, `/api/run` requires either:

- header: `x-admin-token: <token>`
- query string: `?token=<token>`

## Cloudflare setup

Default Worker config lives in `wrangler.toml`.

- station name: `은평구`
- PM2.5 threshold: `36`
- PM10 threshold: `81`
- cron: `0 23 * * *` which is `08:00 KST`

Set these secrets before deployment:

```bash
npx wrangler secret put AIRKOREA_SERVICE_KEY
npx wrangler secret put NTFY_TOPIC
npx wrangler secret put ADMIN_TOKEN
```

Then deploy:

```bash
npm run deploy
```

## Notes

- `AIRKOREA_SERVICE_KEY` supports either the encoded key or the decoding key.
- `NTFY_TOPIC` should be hard to guess because anyone with the same topic can subscribe to it on the public `ntfy.sh` server.
- Refreshing the dashboard never sends a notification. Only `/api/run` and the scheduled job can notify.
- The notification body is a two-line summary such as `미세먼지 보통` and `초미세먼지 나쁨`.
