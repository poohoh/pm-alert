import {
  getGradeEmoji,
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
        --bg: #f6f7f9;
        --surface: #ffffff;
        --surface-hover: #fafbfc;
        --ink: #111827;
        --secondary: #4b5563;
        --muted: #9ca3af;
        --border: #e5e7eb;
        --border-light: #f3f4f6;
        --radius: 16px;
        --radius-sm: 10px;
        --radius-xs: 8px;
        --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
        --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        --shadow-md: 0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
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
        --neutral: #6b7280;
        --neutral-bg: #f9fafb;
        --neutral-border: #e5e7eb;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        min-height: 100dvh;
        background: var(--bg);
        color: var(--ink);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .container {
        max-width: 960px;
        margin: 0 auto;
        padding: 32px 20px 80px;
      }

      /* ── Header ── */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 32px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--ink);
        color: #fff;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: -0.02em;
      }

      .header-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--ink);
      }

      .header-sub {
        font-size: 13px;
        color: var(--muted);
        font-weight: 500;
      }

      .live-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--surface);
        border: 1px solid var(--border);
        font-size: 12px;
        font-weight: 600;
        color: var(--secondary);
        box-shadow: var(--shadow-sm);
      }

      .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--good);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* ── Status Banner ── */
      .status-banner {
        padding: 28px;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: var(--surface);
        box-shadow: var(--shadow);
        margin-bottom: 16px;
      }

      .status-banner.tone-good { border-left: 4px solid var(--good); }
      .status-banner.tone-moderate { border-left: 4px solid var(--moderate); }
      .status-banner.tone-bad { border-left: 4px solid var(--bad); }
      .status-banner.tone-very-bad { border-left: 4px solid var(--very-bad); }
      .status-banner.tone-unknown { border-left: 4px solid var(--neutral); }

      .status-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .status-grade-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-emoji {
        font-size: 28px;
        line-height: 1;
      }

      .status-text h1 {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }

      .status-text .grade-label {
        font-size: 14px;
        font-weight: 600;
        margin-top: 2px;
      }

      .tone-good .grade-label { color: var(--good); }
      .tone-moderate .grade-label { color: var(--moderate); }
      .tone-bad .grade-label { color: var(--bad); }
      .tone-very-bad .grade-label { color: var(--very-bad); }
      .tone-unknown .grade-label { color: var(--neutral); }

      .status-khai {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }

      .khai-value {
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1;
        color: var(--ink);
      }

      .khai-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }

      .status-desc {
        margin-top: 14px;
        font-size: 14px;
        line-height: 1.7;
        color: var(--secondary);
      }

      .status-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 18px;
      }

      .meta-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border-radius: var(--radius-xs);
        background: var(--border-light);
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary);
      }

      .meta-tag svg {
        width: 13px;
        height: 13px;
        opacity: 0.5;
      }

      /* ── Metric Cards ── */
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }

      .metric-card {
        padding: 24px;
        border-radius: var(--radius);
        background: var(--surface);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        transition: box-shadow 0.2s, border-color 0.2s;
      }

      .metric-card:hover {
        box-shadow: var(--shadow-md);
      }

      .metric-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .metric-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .metric-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }

      .tone-good .metric-badge { background: var(--good-bg); color: var(--good); border: 1px solid var(--good-border); }
      .tone-moderate .metric-badge { background: var(--moderate-bg); color: var(--moderate); border: 1px solid var(--moderate-border); }
      .tone-bad .metric-badge { background: var(--bad-bg); color: var(--bad); border: 1px solid var(--bad-border); }
      .tone-very-bad .metric-badge { background: var(--very-bad-bg); color: var(--very-bad); border: 1px solid var(--very-bad-border); }
      .tone-unknown .metric-badge { background: var(--neutral-bg); color: var(--neutral); border: 1px solid var(--neutral-border); }

      .metric-name {
        margin-top: 16px;
        font-size: 15px;
        font-weight: 700;
        color: var(--ink);
      }

      .metric-value-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-top: 8px;
      }

      .metric-value {
        font-size: 48px;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
        color: var(--ink);
      }

      .metric-unit {
        font-size: 14px;
        font-weight: 600;
        color: var(--muted);
      }

      .metric-range {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--border-light);
        font-size: 13px;
        color: var(--muted);
        font-weight: 500;
      }

      /* ── Info Grid ── */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .info-card {
        padding: 20px;
        border-radius: var(--radius);
        background: var(--surface);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }

      .info-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-xs);
        display: grid;
        place-items: center;
        margin-bottom: 12px;
      }

      .info-icon svg {
        width: 16px;
        height: 16px;
      }

      .info-icon.alert-icon { background: var(--bad-bg); color: var(--bad); }
      .info-icon.page-icon { background: #eff6ff; color: #2563eb; }
      .info-icon.clock-icon { background: #f5f3ff; color: #7c3aed; }

      .info-card h2 {
        font-size: 14px;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 6px;
      }

      .info-card p {
        font-size: 13px;
        line-height: 1.6;
        color: var(--secondary);
      }

      .info-card code {
        font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
        font-size: 12px;
        padding: 2px 5px;
        border-radius: 4px;
        background: var(--border-light);
        color: var(--ink);
      }

      /* ── Responsive ── */
      @media (max-width: 768px) {
        .container { padding: 20px 16px 60px; }
        .metric-grid { grid-template-columns: 1fr; }
        .info-grid { grid-template-columns: 1fr; }
        .status-top { flex-direction: column; }
        .status-khai { align-items: flex-start; flex-direction: row; gap: 8px; align-items: baseline; }
        .khai-label { order: -1; }
        .metric-value { font-size: 40px; }
      }

      /* ── Fade in ── */
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .status-banner { animation: fadeUp 0.4s ease-out; }
      .metric-card:nth-child(1) { animation: fadeUp 0.4s ease-out 0.05s both; }
      .metric-card:nth-child(2) { animation: fadeUp 0.4s ease-out 0.1s both; }
      .info-card:nth-child(1) { animation: fadeUp 0.4s ease-out 0.15s both; }
      .info-card:nth-child(2) { animation: fadeUp 0.4s ease-out 0.2s both; }
      .info-card:nth-child(3) { animation: fadeUp 0.4s ease-out 0.25s both; }
    </style>
  </head>
  <body>
    <div class="container">
      <header class="header">
        <div class="header-left">
          <div class="logo">PM</div>
          <div>
            <div class="header-title">${escapeHtml(result.measurement.stationName)} 대기질</div>
            <div class="header-sub">AirKorea 실시간 모니터링</div>
          </div>
        </div>
        <div class="live-badge">
          <span class="live-dot"></span>
          Live
        </div>
      </header>

      <section class="status-banner ${overallToneClass}">
        <div class="status-top">
          <div class="status-grade-row">
            <div class="status-emoji">${escapeHtml(getGradeEmoji(overallGrade))}</div>
            <div class="status-text">
              <h1>${escapeHtml(result.measurement.stationName)} 대기 현황</h1>
              <div class="grade-label">${escapeHtml(toKoreanGrade(overallGrade))}</div>
            </div>
          </div>
          <div class="status-khai">
            <div class="khai-value">${escapeHtml(displayMetric(result.measurement.khaiValue))}</div>
            <div class="khai-label">통합지수 (KHAI)</div>
          </div>
        </div>
        <p class="status-desc">${escapeHtml(leadMessage)}</p>
        <div class="status-meta">
          <span class="meta-tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4v4.25l-2.5 1.5-.5-.87L7.5 7.5V4h1z"/></svg>
            측정 ${escapeHtml(result.measurement.dataTime || "정보 없음")}
          </span>
          <span class="meta-tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.399l-.257.006.082-.381 2.095-.547z"/><circle cx="8" cy="4.5" r=".75"/></svg>
            확인 ${escapeHtml(result.checkedAt)}
          </span>
          <span class="meta-tag">
            ${result.shouldNotify
              ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/></svg>
              기준 초과 감지`
              : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>
              기준 이내`}
          </span>
        </div>
      </section>

      <section class="metric-grid">
        ${renderMetricCard("미세먼지", "PM10", result.measurement.pm10Value, result.measurement.pm10Grade, "pm10")}
        ${renderMetricCard("초미세먼지", "PM2.5", result.measurement.pm25Value, result.measurement.pm25Grade, "pm25")}
      </section>

      <section class="info-grid">
        <article class="info-card">
          <div class="info-icon alert-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
          </div>
          <h2>알림 상태</h2>
          <p>${escapeHtml(exceededSummary)}</p>
          <p style="margin-top: 6px;">기준: PM2.5 ${result.thresholds.pm25} · PM10 ${result.thresholds.pm10}</p>
        </article>
        <article class="info-card">
          <div class="info-icon page-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75V1.75z"/></svg>
          </div>
          <h2>페이지 안내</h2>
          <p>새로고침해도 알림은 발송되지 않습니다. 알림은 스케줄 실행 또는 <code>/api/run</code> 호출 시에만 발송됩니다.</p>
        </article>
        <article class="info-card">
          <div class="info-icon clock-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4v4.25l-2.5 1.5-.5-.87L7.5 7.5V4h1z"/></svg>
          </div>
          <h2>실행 주기</h2>
          <p>매일 오전 8시 (KST) 자동 실행됩니다. <code>/api/status</code>로 실시간 조회, <code>/api/run</code>으로 수동 실행이 가능합니다.</p>
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
        background: #f6f7f9;
        color: #111827;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      article {
        max-width: 480px;
        margin: 24px;
        padding: 32px;
        border-radius: 16px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-left: 4px solid #dc2626;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      }

      .error-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #fef2f2;
        color: #dc2626;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
      }

      h1 {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin-bottom: 8px;
      }

      p {
        color: #4b5563;
        font-size: 14px;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <article>
      <div class="error-icon">
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
      </div>
      <h1>대시보드를 불러오지 못했습니다</h1>
      <p>${escapeHtml(message)}</p>
    </article>
  </body>
</html>`;
}

function renderMetricCard(
  label: string,
  shortLabel: string,
  value: number | null,
  grade: string | null,
  metricType: "pm10" | "pm25"
): string {
  const range = getGradeRange(metricType, grade);
  const toneClass = getToneClass(grade);

  return `<article class="metric-card ${toneClass}">
    <div class="metric-header">
      <span class="metric-label">${escapeHtml(shortLabel)}</span>
      <span class="metric-badge">${escapeHtml(getGradeEmoji(grade))} ${escapeHtml(toKoreanGrade(grade))}</span>
    </div>
    <div class="metric-name">${escapeHtml(label)}</div>
    <div class="metric-value-row">
      <span class="metric-value">${escapeHtml(displayMetric(value))}</span>
      <span class="metric-unit">㎍/㎥</span>
    </div>
    <div class="metric-range">등급 구간: ${escapeHtml(range ?? "정보 없음")}</div>
  </article>`;
}

function displayMetric(value: number | null): string {
  return value === null ? "—" : String(value);
}

function getOverallGrade(result: CheckResult): string | null {
  const pm10Severity = getGradeSeverity(result.measurement.pm10Grade);
  const pm25Severity = getGradeSeverity(result.measurement.pm25Grade);

  return pm25Severity >= pm10Severity
    ? result.measurement.pm25Grade
    : result.measurement.pm10Grade;
}

function getToneClass(grade: string | null): string {
  switch (getGradeSeverity(grade)) {
    case 1:
      return "tone-good";
    case 2:
      return "tone-moderate";
    case 3:
      return "tone-bad";
    case 4:
      return "tone-very-bad";
    default:
      return "tone-unknown";
  }
}

function getHeroDescription(grade: string | null): string {
  switch (getGradeSeverity(grade)) {
    case 1:
      return "오늘은 비교적 편안한 공기입니다. 산책 전에 가볍게 확인하는 용도로 충분합니다.";
    case 2:
      return "전반적으로 무난하지만, 민감군이라면 외출 시간을 조금만 조절해도 좋습니다.";
    case 3:
      return "실외 활동 전 공기 상태를 한 번 더 확인하는 편이 좋습니다. 마스크를 챙겨두면 안심됩니다.";
    case 4:
      return "공기 질이 강하게 나쁜 편입니다. 장시간 외출이나 격한 야외 활동은 줄이는 편이 좋습니다.";
    default:
      return "측정값을 가져오는 중입니다. 잠시 후 다시 확인해 주세요.";
  }
}

function getLeadMessage(result: CheckResult): string {
  const pm10Severity = getGradeSeverity(result.measurement.pm10Grade);
  const pm25Severity = getGradeSeverity(result.measurement.pm25Grade);

  if (pm10Severity === 0 && pm25Severity === 0) {
    return "아직 표시할 수 있는 실시간 등급 정보가 없습니다.";
  }

  const overallGrade = pm25Severity >= pm10Severity
    ? result.measurement.pm25Grade
    : result.measurement.pm10Grade;
  const description = getHeroDescription(overallGrade);

  if (pm10Severity === pm25Severity) {
    return `미세먼지와 초미세먼지가 모두 ${toKoreanGrade(result.measurement.pm10Grade)} 수준입니다. ${description}`;
  }

  if (pm25Severity > pm10Severity) {
    return `초미세먼지가 더 강하게 나타나고 있습니다. ${description}`;
  }

  return `미세먼지가 더 강하게 나타나고 있습니다. ${description}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
