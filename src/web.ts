import type { CheckResult } from "./types";

export function renderDashboard(result: CheckResult): string {
  const statusLabel = result.shouldNotify ? "Alert active" : "Air looks okay";
  const statusClass = result.shouldNotify ? "status status-alert" : "status status-ok";
  const exceeded = result.exceeded.length
    ? result.exceeded.map((item) => `${item.label} ${item.value}`).join(" / ")
    : "None";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>pm-alert</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f2e8;
        --panel: rgba(255, 250, 240, 0.84);
        --ink: #1f2937;
        --muted: #6b7280;
        --line: rgba(31, 41, 55, 0.12);
        --ok: #0f766e;
        --alert: #b91c1c;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.16), transparent 32%),
          radial-gradient(circle at top right, rgba(185, 28, 28, 0.14), transparent 30%),
          linear-gradient(160deg, #f6f2e8, #ece5d5 55%, #f8f5ee);
        color: var(--ink);
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
      }

      main {
        max-width: 900px;
        margin: 0 auto;
        padding: 48px 20px 64px;
      }

      .hero {
        display: grid;
        gap: 18px;
      }

      h1 {
        margin: 0;
        font-size: clamp(2.4rem, 6vw, 4.2rem);
        line-height: 0.95;
        letter-spacing: -0.04em;
      }

      p {
        margin: 0;
        color: var(--muted);
        font-size: 1.05rem;
      }

      .status {
        width: fit-content;
        padding: 10px 14px;
        border-radius: 999px;
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .status-ok {
        background: rgba(15, 118, 110, 0.12);
        color: var(--ok);
      }

      .status-alert {
        background: rgba(185, 28, 28, 0.12);
        color: var(--alert);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 28px;
      }

      .card {
        padding: 22px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      }

      .label {
        color: var(--muted);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .value {
        margin-top: 10px;
        font-size: clamp(1.7rem, 4vw, 2.6rem);
        line-height: 1;
      }

      .small {
        margin-top: 10px;
        font-size: 0.95rem;
      }

      code {
        font-family: "SFMono-Regular", "Cascadia Code", "Liberation Mono", monospace;
        font-size: 0.95em;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="${statusClass}">${statusLabel}</div>
        <h1>${escapeHtml(result.measurement.stationName)} PM dashboard</h1>
        <p>
          Live pull from AirKorea for ${escapeHtml(result.measurement.stationName)}.
          Refreshing this page does not send notifications.
        </p>
      </section>

      <section class="grid">
        <article class="card">
          <div class="label">PM2.5</div>
          <div class="value">${displayMetric(result.measurement.pm25Value)}</div>
          <div class="small">Grade: ${escapeHtml(result.measurement.pm25Grade ?? "N/A")}</div>
        </article>
        <article class="card">
          <div class="label">PM10</div>
          <div class="value">${displayMetric(result.measurement.pm10Value)}</div>
          <div class="small">Grade: ${escapeHtml(result.measurement.pm10Grade ?? "N/A")}</div>
        </article>
        <article class="card">
          <div class="label">Measured at</div>
          <div class="value">${escapeHtml(result.measurement.dataTime || "Unknown")}</div>
          <div class="small">Checked at ${escapeHtml(result.checkedAt)}</div>
        </article>
        <article class="card">
          <div class="label">Exceeded metrics</div>
          <div class="value">${escapeHtml(exceeded)}</div>
          <div class="small">
            Thresholds: PM2.5 ${result.thresholds.pm25}, PM10 ${result.thresholds.pm10}
          </div>
        </article>
      </section>

      <section class="grid">
        <article class="card">
          <div class="label">Endpoints</div>
          <div class="small"><code>GET /api/status</code> returns live JSON without notifying.</div>
          <div class="small"><code>POST /api/run</code> runs a manual check and can notify.</div>
        </article>
        <article class="card">
          <div class="label">Cron</div>
          <div class="small">
            Default schedule is <code>0 23 * * *</code>, which is 08:00 KST the next day.
          </div>
        </article>
      </section>
    </main>
  </body>
</html>`;
}

export function renderErrorDashboard(message: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>pm-alert</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #101828, #1f2937);
        color: #f8fafc;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      article {
        max-width: 620px;
        margin: 24px;
        padding: 28px;
        border-radius: 20px;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(248, 250, 252, 0.12);
      }

      h1 {
        margin: 0 0 10px;
      }

      p {
        margin: 0;
        color: rgba(248, 250, 252, 0.78);
      }
    </style>
  </head>
  <body>
    <article>
      <h1>pm-alert could not load</h1>
      <p>${escapeHtml(message)}</p>
    </article>
  </body>
</html>`;
}

function displayMetric(value: number | null): string {
  return value === null ? "N/A" : String(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
