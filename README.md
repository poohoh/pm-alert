# pm-alert

Cloudflare Worker project for daily PM alerts from AirKorea, with ntfy push notifications and a live status dashboard.

## What it does

- Pulls the latest PM10 and PM2.5 reading for a single AirKorea station
- Pulls the same-day hourly history in one AirKorea request and renders it on the dashboard
- Sends a daily ntfy summary notification with PM10 and PM2.5 grades, values, and grade ranges
- Runs automatically on a Cloudflare Cron schedule
- Exposes a dashboard at `/` and live JSON at `/api/status`

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
- `GET /api/status` returns the live check result as JSON, including hourly history from `00:00` to the latest reading
- `GET` or `POST /api/run` triggers a manual run and sends the daily summary notification

`/api/run` also supports `?notify=0` if you want to execute the check without sending a push notification.

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

- The dashboard shows:
  - the latest PM10 / PM2.5 cards
  - hourly line charts from midnight to the current reading
  - an AirKorea grade criteria table
- `AIRKOREA_SERVICE_KEY` supports either the encoded key or the decoding key.
- `NTFY_TOPIC` should be hard to guess because anyone with the same topic can subscribe to it on the public `ntfy.sh` server.
- Refreshing the dashboard never sends a notification. Only `/api/run` and the scheduled job can notify.
- The notification body is a two-line summary such as:

  ```text
  🔴 미세먼지 나쁨 (97) (81 ~ 150)
  🚨🚨 초미세먼지 매우 나쁨 (82) (76+)
  ```
