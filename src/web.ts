import {
  getGradeEmoji,
  getGradeCriteriaRows,
  getGradeRange,
  getGradeSeverity,
  toKoreanGrade
} from "./air-quality";
import type { CheckResult } from "./types";

export function renderDashboard(result: CheckResult): string {
  const overallGrade = getOverallGrade(result);
  const overallToneClass = getToneClass(overallGrade);
  const exceededSummary = result.exceeded.length
    ? result.exceeded.map((item) => `${item.label} ${item.value}/${item.threshold}`).join(" · ")
    : "현재 알림 기준을 넘은 항목은 없습니다.";
  const leadMessage = getLeadMessage(result);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(result.measurement.stationName)} 미세먼지 대시보드</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      :root {
        --bg: #f8f9fb;
        --surface: #ffffff;
        --ink: #0f172a;
        --secondary: #475569;
        --muted: #94a3b8;
        --border: #e2e8f0;
        --border-light: #f1f5f9;
        --radius: 14px;
        --radius-sm: 10px;
        --radius-xs: 6px;
        --shadow-sm: 0 1px 2px rgba(0,0,0,0.03);
        --shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
        --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
        --good: #059669;
        --good-bg: #ecfdf5;
        --good-border: #a7f3d0;
        --moderate: #d97706;
        --moderate-bg: #fffbeb;
        --moderate-border: #fde68a;
        --bad: #dc2626;
        --bad-bg: #fef2f2;
        --bad-border: #fecaca;
        --very-bad: #7c2d12;
        --very-bad-bg: #fff1f2;
        --very-bad-border: #fda4af;
        --neutral: #64748b;
        --neutral-bg: #f8fafc;
        --neutral-border: #e2e8f0;
        --chart-pm10: #3b82f6;
        --chart-pm25: #f43f5e;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        min-height: 100dvh;
        background: var(--bg);
        color: var(--ink);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .wrap {
        max-width: 880px;
        margin: 0 auto;
        padding: 28px 20px 72px;
      }

      /* ── Nav ── */
      nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }

      .nav-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--ink);
        color: #fff;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: -0.03em;
      }

      .nav-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--ink);
      }

      .nav-sub {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
      }

      .live-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 11px;
        border-radius: 999px;
        background: var(--surface);
        border: 1px solid var(--border);
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary);
        box-shadow: var(--shadow-sm);
      }

      .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--good);
        animation: blink 2s ease-in-out infinite;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      /* ── Card base ── */
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }

      /* ── Hero banner ── */
      .hero {
        padding: 24px;
        margin-bottom: 12px;
      }

      .hero.tone-good      { border-left: 3px solid var(--good); }
      .hero.tone-moderate   { border-left: 3px solid var(--moderate); }
      .hero.tone-bad        { border-left: 3px solid var(--bad); }
      .hero.tone-very-bad   { border-left: 3px solid var(--very-bad); }
      .hero.tone-unknown    { border-left: 3px solid var(--neutral); }

      .hero-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .hero-grade {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .hero-emoji { font-size: 24px; line-height: 1; }

      .hero-title {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.3;
      }

      .hero-label {
        font-size: 13px;
        font-weight: 600;
        margin-top: 1px;
      }

      .tone-good .hero-label      { color: var(--good); }
      .tone-moderate .hero-label   { color: var(--moderate); }
      .tone-bad .hero-label        { color: var(--bad); }
      .tone-very-bad .hero-label   { color: var(--very-bad); }
      .tone-unknown .hero-label    { color: var(--neutral); }

      .hero-khai {
        text-align: right;
      }

      .khai-num {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
      }

      .khai-tag {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
        margin-top: 3px;
      }

      .hero-desc {
        margin-top: 12px;
        font-size: 13.5px;
        line-height: 1.7;
        color: var(--secondary);
      }

      .hero-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 14px;
      }

      .tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 9px;
        border-radius: var(--radius-xs);
        background: var(--border-light);
        font-size: 11px;
        font-weight: 500;
        color: var(--secondary);
      }

      .tag svg { width: 12px; height: 12px; opacity: 0.45; }

      /* ── 2-col grid ── */
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 12px;
      }

      /* ── Metric card ── */
      .m-card { padding: 20px 22px; }

      .m-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .m-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .m-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
      }

      .tone-good .m-badge      { background: var(--good-bg); color: var(--good); border: 1px solid var(--good-border); }
      .tone-moderate .m-badge   { background: var(--moderate-bg); color: var(--moderate); border: 1px solid var(--moderate-border); }
      .tone-bad .m-badge        { background: var(--bad-bg); color: var(--bad); border: 1px solid var(--bad-border); }
      .tone-very-bad .m-badge   { background: var(--very-bad-bg); color: var(--very-bad); border: 1px solid var(--very-bad-border); }
      .tone-unknown .m-badge    { background: var(--neutral-bg); color: var(--neutral); border: 1px solid var(--neutral-border); }

      .m-name {
        margin-top: 14px;
        font-size: 13px;
        font-weight: 600;
        color: var(--secondary);
      }

      .m-val-row {
        display: flex;
        align-items: baseline;
        gap: 5px;
        margin-top: 4px;
      }

      .m-val {
        font-size: 42px;
        font-weight: 800;
        letter-spacing: -0.05em;
        line-height: 1.1;
      }

      .m-unit {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }

      .m-range {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-light);
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
      }

      /* ── Chart card ── */
      .chart-card { padding: 22px; }

      .chart-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 14px;
      }

      .chart-kicker {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }

      .chart-card h2 {
        margin-top: 3px;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -0.01em;
      }

      .chart-window {
        padding: 4px 9px;
        border-radius: 999px;
        background: var(--border-light);
        color: var(--secondary);
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        align-self: flex-start;
        margin-top: 3px;
      }

      .chart-stats {
        display: flex;
        gap: 6px;
        margin-bottom: 14px;
      }

      .chart-stat {
        padding: 5px 9px;
        border-radius: var(--radius-xs);
        background: var(--border-light);
        color: var(--secondary);
        font-size: 11px;
        font-weight: 600;
      }

      .chart-stat b { color: var(--ink); }

      .chart-area {
        padding: 10px 8px 6px;
        border-radius: var(--radius-sm);
        background: var(--border-light);
      }

      .chart-svg {
        width: 100%;
        height: auto;
        display: block;
      }

      .chart-empty {
        padding: 32px 0;
        text-align: center;
        color: var(--muted);
        font-size: 12px;
      }

      .chart-note {
        margin-top: 10px;
        font-size: 11.5px;
        color: var(--muted);
        line-height: 1.5;
      }

      /* ── Criteria ── */
      .criteria { padding: 22px; margin-bottom: 12px; }

      .criteria-top {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .criteria-kicker {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }

      .criteria h2 {
        margin-top: 3px;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -0.01em;
      }

      .criteria-sub {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
      }

      .cr-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 13px;
      }

      .cr-table th {
        padding: 8px 14px;
        text-align: left;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        border-bottom: 1px solid var(--border);
      }

      .cr-table td {
        padding: 10px 14px;
        color: var(--secondary);
        border-bottom: 1px solid var(--border-light);
      }

      .cr-table tr:last-child td { border-bottom: none; }

      .cr-grade {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        color: var(--ink);
      }

      .cr-table td:not(:first-child) {
        font-variant-numeric: tabular-nums;
      }

      /* ── Footer info ── */
      .footer-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .f-card { padding: 18px; }

      .f-icon {
        width: 28px;
        height: 28px;
        border-radius: 7px;
        display: grid;
        place-items: center;
        margin-bottom: 10px;
      }

      .f-icon svg { width: 14px; height: 14px; }

      .f-icon.ic-alert  { background: var(--bad-bg); color: var(--bad); }
      .f-icon.ic-page   { background: #eff6ff; color: #3b82f6; }
      .f-icon.ic-clock  { background: #f5f3ff; color: #7c3aed; }

      .f-card h3 {
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .f-card p {
        font-size: 12px;
        line-height: 1.6;
        color: var(--secondary);
      }

      .f-card code {
        font-family: 'SF Mono', 'Cascadia Code', monospace;
        font-size: 11px;
        padding: 1px 4px;
        border-radius: 3px;
        background: var(--border-light);
        color: var(--ink);
      }

      /* ── Responsive ── */
      @media (max-width: 720px) {
        .wrap { padding: 20px 14px 56px; }
        .grid-2 { grid-template-columns: 1fr; }
        .footer-grid { grid-template-columns: 1fr; }
        .hero-top { flex-direction: column; }
        .hero-khai { text-align: left; display: flex; align-items: baseline; gap: 8px; flex-direction: row-reverse; }
        .m-val { font-size: 36px; }
      }

      /* ── Animations ── */
      @keyframes up {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .hero       { animation: up .35s ease-out both; }
      .grid-2 > :nth-child(1) { animation: up .35s ease-out .04s both; }
      .grid-2 > :nth-child(2) { animation: up .35s ease-out .08s both; }
      .criteria   { animation: up .35s ease-out .12s both; }
      .footer-grid > :nth-child(1) { animation: up .35s ease-out .16s both; }
      .footer-grid > :nth-child(2) { animation: up .35s ease-out .19s both; }
      .footer-grid > :nth-child(3) { animation: up .35s ease-out .22s both; }
    </style>
  </head>
  <body>
    <div class="wrap">

      <nav>
        <div class="nav-left">
          <div class="logo">PM</div>
          <div>
            <div class="nav-title">${escapeHtml(result.measurement.stationName)} 대기질</div>
            <div class="nav-sub">AirKorea 실시간</div>
          </div>
        </div>
        <div class="live-pill"><span class="live-dot"></span> Live</div>
      </nav>

      <!-- Hero -->
      <section class="card hero ${overallToneClass}">
        <div class="hero-top">
          <div class="hero-grade">
            <span class="hero-emoji">${escapeHtml(getGradeEmoji(overallGrade))}</span>
            <div>
              <div class="hero-title">${escapeHtml(result.measurement.stationName)} 대기 현황</div>
              <div class="hero-label">${escapeHtml(toKoreanGrade(overallGrade))}</div>
            </div>
          </div>
          <div class="hero-khai">
            <div class="khai-num">${escapeHtml(displayMetric(result.measurement.khaiValue))}</div>
            <div class="khai-tag">KHAI</div>
          </div>
        </div>
        <p class="hero-desc">${escapeHtml(leadMessage)}</p>
        <div class="hero-tags">
          <span class="tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4v4.25l-2.5 1.5-.5-.87L7.5 7.5V4h1z"/></svg>
            측정 ${escapeHtml(result.measurement.dataTime || "—")}
          </span>
          <span class="tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.399l-.257.006.082-.381 2.095-.547z"/><circle cx="8" cy="4.5" r=".75"/></svg>
            확인 ${escapeHtml(result.checkedAt)}
          </span>
          <span class="tag">${result.shouldNotify ? "기준 초과 감지" : "기준 이내"}</span>
        </div>
      </section>

      <!-- Metric cards -->
      <section class="grid-2">
        ${renderMetricCard("미세먼지", "PM10", result.measurement.pm10Value, result.measurement.pm10Grade, "pm10")}
        ${renderMetricCard("초미세먼지", "PM2.5", result.measurement.pm25Value, result.measurement.pm25Grade, "pm25")}
      </section>

      <!-- History charts -->
      <section class="grid-2">
        ${renderChartCard("미세먼지", "PM10", result.history, "pm10")}
        ${renderChartCard("초미세먼지", "PM2.5", result.history, "pm25")}
      </section>

      <!-- Criteria table -->
      <section class="card criteria">
        <div class="criteria-top">
          <div>
            <div class="criteria-kicker">Grade Guide</div>
            <h2>등급 기준표</h2>
          </div>
          <span class="criteria-sub">AirKorea 1시간 기준 (㎍/㎥)</span>
        </div>
        <div style="overflow-x:auto">
          <table class="cr-table">
            <thead><tr><th>등급</th><th>PM10 미세먼지</th><th>PM2.5 초미세먼지</th></tr></thead>
            <tbody>${renderCriteriaRows()}</tbody>
          </table>
        </div>
      </section>

      <!-- Footer info -->
      <section class="footer-grid">
        <article class="card f-card">
          <div class="f-icon ic-alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
          </div>
          <h3>알림 상태</h3>
          <p>${escapeHtml(exceededSummary)}</p>
          <p style="margin-top:4px">기준 PM2.5 ${result.thresholds.pm25} · PM10 ${result.thresholds.pm10}</p>
        </article>
        <article class="card f-card">
          <div class="f-icon ic-page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75V1.75z"/></svg>
          </div>
          <h3>페이지 안내</h3>
          <p>새로고침해도 알림은 발송되지 않습니다. 알림은 스케줄 또는 <code>/api/run</code> 호출 시에만 발송됩니다.</p>
        </article>
        <article class="card f-card">
          <div class="f-icon ic-clock">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4v4.25l-2.5 1.5-.5-.87L7.5 7.5V4h1z"/></svg>
          </div>
          <h3>실행 주기</h3>
          <p>매일 오전 8시 (KST) 자동 실행. <code>/api/status</code> 실시간 조회, <code>/api/run</code> 수동 실행.</p>
        </article>
      </section>

    </div>
  </body>
</html>`;
}

export function renderErrorDashboard(message: string): string {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>pm-alert</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        background: #f8f9fb;
        color: #0f172a;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      article {
        max-width: 440px;
        margin: 24px;
        padding: 28px;
        border-radius: 14px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-left: 3px solid #dc2626;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }
      .err-icon {
        width: 36px; height: 36px;
        border-radius: 8px;
        background: #fef2f2; color: #dc2626;
        display: grid; place-items: center;
        margin-bottom: 14px;
      }
      h1 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
      p { color: #475569; font-size: 13px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <article>
      <div class="err-icon">
        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
      </div>
      <h1>대시보드를 불러오지 못했습니다</h1>
      <p>${escapeHtml(message)}</p>
    </article>
  </body>
</html>`;
}

/* ────────────────────────────────────────── */
/*  Renderers                                  */
/* ────────────────────────────────────────── */

function renderMetricCard(
  label: string,
  shortLabel: string,
  value: number | null,
  grade: string | null,
  metricType: "pm10" | "pm25"
): string {
  const range = getGradeRange(metricType, grade);
  const toneClass = getToneClass(grade);

  return `<article class="card m-card ${toneClass}">
    <div class="m-head">
      <span class="m-label">${escapeHtml(shortLabel)}</span>
      <span class="m-badge">${escapeHtml(getGradeEmoji(grade))} ${escapeHtml(toKoreanGrade(grade))}</span>
    </div>
    <div class="m-name">${escapeHtml(label)}</div>
    <div class="m-val-row">
      <span class="m-val">${escapeHtml(displayMetric(value))}</span>
      <span class="m-unit">㎍/㎥</span>
    </div>
    <div class="m-range">등급 구간 ${escapeHtml(range ?? "—")}</div>
  </article>`;
}

function renderChartCard(
  label: string,
  shortLabel: string,
  history: CheckResult["history"],
  metricType: "pm10" | "pm25"
): string {
  const values = history.map((p) => getMetricValue(p, metricType));
  const nums = values.filter((v): v is number => v !== null);
  const latest = [...values].reverse().find((v): v is number => v !== null) ?? null;
  const high = nums.length ? Math.max(...nums) : null;
  const low = nums.length ? Math.min(...nums) : null;
  const end = history.at(-1)?.timeLabel ?? "—";
  const color = metricType === "pm10" ? "var(--chart-pm10)" : "var(--chart-pm25)";

  return `<article class="card chart-card">
    <div class="chart-head">
      <div>
        <div class="chart-kicker">${escapeHtml(shortLabel)} Trend</div>
        <h2>${escapeHtml(label)} 시간대 추이</h2>
      </div>
      <div class="chart-window">00:00 – ${escapeHtml(end)}</div>
    </div>
    <div class="chart-stats">
      <span class="chart-stat">현재 <b>${escapeHtml(displayMetric(latest))}</b></span>
      <span class="chart-stat">최고 <b>${escapeHtml(displayMetric(high))}</b></span>
      <span class="chart-stat">최저 <b>${escapeHtml(displayMetric(low))}</b></span>
    </div>
    ${
      nums.length > 0
        ? `<div class="chart-area">${renderSvgChart(history, metricType, color)}</div>`
        : `<div class="chart-empty">표시할 데이터가 아직 없습니다.</div>`
    }
    <p class="chart-note">0시부터 현재 시각까지 1시간 간격 측정값입니다.</p>
  </article>`;
}

function renderCriteriaRows(): string {
  return getGradeCriteriaRows()
    .map(
      (row) => `<tr>
        <td><span class="cr-grade">${escapeHtml(row.emoji)} ${escapeHtml(row.label)}</span></td>
        <td>${escapeHtml(row.pm10Range)}</td>
        <td>${escapeHtml(row.pm25Range)}</td>
      </tr>`
    )
    .join("");
}

/* ────────────────────────────────────────── */
/*  SVG chart                                  */
/* ────────────────────────────────────────── */

function renderSvgChart(
  history: CheckResult["history"],
  metricType: "pm10" | "pm25",
  color: string
): string {
  const W = 480;
  const H = 200;
  const pad = { top: 16, right: 10, bottom: 30, left: 36 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;

  const nums = history
    .map((p) => getMetricValue(p, metricType))
    .filter((v): v is number => v !== null);
  const maxVal = niceMax(Math.max(...nums, metricType === "pm10" ? 80 : 35));

  const pts = history.map((p, i) => {
    const v = getMetricValue(p, metricType);
    const x = history.length === 1
      ? pad.left + pw / 2
      : pad.left + (pw * i) / (history.length - 1);
    return {
      label: p.timeLabel,
      v,
      x,
      y: v !== null ? pad.top + (1 - v / maxVal) * ph : null
    };
  });

  const linePath = buildLine(pts);
  const areaPath = buildArea(pts, pad.top + ph);

  // Grid lines
  const steps = 4;
  let grid = "";
  for (let i = 0; i <= steps; i++) {
    const y = pad.top + (ph * i) / steps;
    const val = Math.round(maxVal - (maxVal * i) / steps);
    grid += `<line x1="${pad.left}" y1="${f(y)}" x2="${W - pad.right}" y2="${f(y)}" stroke="#dde3eb" stroke-width="1"/>`;
    grid += `<text x="${pad.left - 7}" y="${f(y + 3.5)}" text-anchor="end" fill="#94a3b8" font-size="10" font-weight="600">${val}</text>`;
  }

  // Time ticks
  let ticks = "";
  pts.forEach((p, i) => {
    if (showTick(i, pts.length)) {
      ticks += `<text x="${f(p.x)}" y="${H - 6}" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">${escapeHtml(p.label.slice(0, 5))}</text>`;
    }
  });

  // Dots
  const dots = pts
    .filter((p): p is typeof p & { v: number; y: number } => p.v !== null && p.y !== null)
    .map(
      (p) =>
        `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`
    )
    .join("");

  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(metricType)} 추이">
    ${grid}
    <path d="${areaPath}" fill="${color}" opacity="0.08"/>
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    ${ticks}
  </svg>`;
}

function buildLine(pts: Array<{ v: number | null; x: number; y: number | null }>): string {
  const cmds: string[] = [];
  let active = false;
  for (const p of pts) {
    if (p.v === null || p.y === null) { active = false; continue; }
    cmds.push(`${active ? "L" : "M"} ${f(p.x)} ${f(p.y)}`);
    active = true;
  }
  return cmds.join(" ");
}

function buildArea(pts: Array<{ v: number | null; x: number; y: number | null }>, baseline: number): string {
  const segments: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];

  for (const p of pts) {
    if (p.v === null || p.y === null) {
      if (current.length) { segments.push(current); current = []; }
      continue;
    }
    current.push({ x: p.x, y: p.y });
  }
  if (current.length) segments.push(current);

  return segments.map((seg) => {
    const top = seg.map((s, i) => `${i === 0 ? "M" : "L"} ${f(s.x)} ${f(s.y)}`).join(" ");
    const last = seg[seg.length - 1];
    const first = seg[0];
    return `${top} L ${f(last.x)} ${f(baseline)} L ${f(first.x)} ${f(baseline)} Z`;
  }).join(" ");
}

function f(n: number): string { return n.toFixed(1); }

function niceMax(v: number): number {
  if (v <= 10) return 10;
  if (v <= 50) return Math.ceil(v / 10) * 10;
  if (v <= 100) return Math.ceil(v / 20) * 20;
  return Math.ceil(v / 50) * 50;
}

function showTick(i: number, total: number): boolean {
  if (i === 0 || i === total - 1) return true;
  if (total <= 8) return true;
  return total <= 14 ? i % 2 === 0 : i % 3 === 0;
}

function getMetricValue(p: CheckResult["history"][number], t: "pm10" | "pm25"): number | null {
  return t === "pm10" ? p.pm10Value : p.pm25Value;
}

/* ────────────────────────────────────────── */
/*  Helpers                                    */
/* ────────────────────────────────────────── */

function displayMetric(value: number | null): string {
  return value === null ? "—" : String(value);
}

function getOverallGrade(result: CheckResult): string | null {
  const a = getGradeSeverity(result.measurement.pm10Grade);
  const b = getGradeSeverity(result.measurement.pm25Grade);
  return b >= a ? result.measurement.pm25Grade : result.measurement.pm10Grade;
}

function getToneClass(grade: string | null): string {
  switch (getGradeSeverity(grade)) {
    case 1: return "tone-good";
    case 2: return "tone-moderate";
    case 3: return "tone-bad";
    case 4: return "tone-very-bad";
    default: return "tone-unknown";
  }
}

function getHeroDescription(grade: string | null): string {
  switch (getGradeSeverity(grade)) {
    case 1: return "오늘은 비교적 편안한 공기입니다. 산책 전에 가볍게 확인하는 용도로 충분합니다.";
    case 2: return "전반적으로 무난하지만, 민감군이라면 외출 시간을 조금만 조절해도 좋습니다.";
    case 3: return "실외 활동 전 공기 상태를 한 번 더 확인하세요. 마스크를 챙겨두면 안심됩니다.";
    case 4: return "공기 질이 강하게 나쁜 편입니다. 장시간 외출이나 격한 야외 활동은 줄이는 편이 좋습니다.";
    default: return "측정값을 가져오는 중입니다. 잠시 후 다시 확인해 주세요.";
  }
}

function getLeadMessage(result: CheckResult): string {
  const a = getGradeSeverity(result.measurement.pm10Grade);
  const b = getGradeSeverity(result.measurement.pm25Grade);

  if (a === 0 && b === 0) return "아직 표시할 수 있는 실시간 등급 정보가 없습니다.";

  const overall = b >= a ? result.measurement.pm25Grade : result.measurement.pm10Grade;
  const desc = getHeroDescription(overall);

  if (a === b) return `미세먼지와 초미세먼지가 모두 ${toKoreanGrade(result.measurement.pm10Grade)} 수준입니다. ${desc}`;
  if (b > a) return `초미세먼지가 더 강하게 나타나고 있습니다. ${desc}`;
  return `미세먼지가 더 강하게 나타나고 있습니다. ${desc}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
