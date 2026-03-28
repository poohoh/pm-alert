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
      :root {
        color-scheme: light;
        --bg-top: #f2f8ff;
        --bg-bottom: #f8efe3;
        --panel: rgba(255, 251, 246, 0.82);
        --panel-strong: rgba(255, 255, 255, 0.9);
        --ink: #172033;
        --muted: #5f6b80;
        --line: rgba(23, 32, 51, 0.11);
        --shadow: 0 18px 50px rgba(30, 41, 59, 0.08);
        --good: #17924d;
        --moderate: #d1a100;
        --bad: #c43d35;
        --very-bad: #8d1111;
        --neutral: #476285;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at 0% 0%, rgba(42, 122, 209, 0.2), transparent 32%),
          radial-gradient(circle at 100% 0%, rgba(243, 183, 56, 0.24), transparent 28%),
          radial-gradient(circle at 50% 100%, rgba(235, 94, 40, 0.12), transparent 35%),
          linear-gradient(180deg, var(--bg-top), var(--bg-bottom));
        color: var(--ink);
        font-family: "Avenir Next", "SUIT Variable", "Pretendard Variable", "Apple SD Gothic Neo",
          "Noto Sans KR", sans-serif;
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.24) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
        background-size: 28px 28px;
        mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.16), transparent 55%);
      }

      main {
        position: relative;
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 20px 64px;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
        gap: 18px;
        align-items: stretch;
      }

      .hero-copy,
      .hero-panel,
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
      }

      .hero-copy {
        padding: 28px;
      }

      .hero-panel {
        padding: 24px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);
        color: var(--neutral);
        font-size: 0.84rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .eyebrow::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: currentColor;
      }

      h1 {
        margin: 18px 0 14px;
        font-size: clamp(2.4rem, 6vw, 4.8rem);
        line-height: 0.92;
        letter-spacing: -0.04em;
      }

      p,
      li {
        margin: 0;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.6;
      }

      .lede {
        max-width: 52ch;
        font-size: 1.05rem;
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }

      .meta-pill {
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.74);
        border: 1px solid rgba(255, 255, 255, 0.92);
        color: var(--ink);
        font-size: 0.92rem;
        font-weight: 700;
      }

      .hero-panel .label {
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .hero-grade {
        margin-top: 14px;
        font-size: clamp(2rem, 5vw, 3.3rem);
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .hero-summary {
        margin-top: 14px;
      }

      .hero-stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin: 22px 0 0;
      }

      .hero-stats div {
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.9);
      }

      .hero-stats dt {
        color: var(--muted);
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .hero-stats dd {
        margin: 8px 0 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--ink);
      }

      .tone-good {
        --tone: var(--good);
        --tone-soft: rgba(23, 146, 77, 0.16);
      }

      .tone-moderate {
        --tone: var(--moderate);
        --tone-soft: rgba(209, 161, 0, 0.18);
      }

      .tone-bad {
        --tone: var(--bad);
        --tone-soft: rgba(196, 61, 53, 0.16);
      }

      .tone-very-bad {
        --tone: var(--very-bad);
        --tone-soft: rgba(141, 17, 17, 0.16);
      }

      .tone-unknown {
        --tone: var(--neutral);
        --tone-soft: rgba(71, 98, 133, 0.15);
      }

      .hero-panel,
      .metric-card {
        position: relative;
        overflow: hidden;
      }

      .hero-panel::after,
      .metric-card::after {
        content: "";
        position: absolute;
        inset: auto -18% -28% auto;
        width: 210px;
        height: 210px;
        border-radius: 999px;
        background: radial-gradient(circle, var(--tone-soft), transparent 68%);
        pointer-events: none;
      }

      .metric-grid,
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 28px;
      }

      .card {
        padding: 22px;
      }

      .label {
        color: var(--muted);
        font-size: 0.84rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .metric-card {
        padding: 24px;
      }

      .metric-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .metric-name {
        margin-top: 12px;
        font-size: 1.35rem;
        font-weight: 700;
      }

      .metric-grade {
        width: fit-content;
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--tone-soft);
        color: var(--tone);
        font-weight: 800;
        font-size: 0.94rem;
      }

      .metric-value-row {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        margin-top: 20px;
      }

      .value {
        font-size: clamp(2.8rem, 7vw, 4rem);
        line-height: 1;
        letter-spacing: -0.05em;
        color: var(--ink);
      }

      .unit {
        padding-bottom: 8px;
        color: var(--muted);
        font-size: 1rem;
        font-weight: 700;
      }

      .range {
        margin-top: 14px;
        color: var(--muted);
        font-size: 0.96rem;
      }

      .detail-card h2 {
        margin: 14px 0 10px;
        font-size: 1.2rem;
      }

      .detail-card p + p,
      .detail-card ul {
        margin-top: 10px;
      }

      ul {
        padding-left: 18px;
      }

      code {
        font-family: "SFMono-Regular", "Cascadia Code", "Liberation Mono", monospace;
        font-size: 0.95em;
        background: rgba(23, 32, 51, 0.06);
        padding: 0.08em 0.3em;
        border-radius: 0.45em;
      }

      @media (max-width: 860px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .hero-copy,
        .hero-panel,
        .card,
        .metric-card {
          border-radius: 24px;
        }
      }

      @media (max-width: 560px) {
        main {
          padding-top: 24px;
        }

        .hero-copy,
        .hero-panel,
        .card,
        .metric-card {
          padding: 20px;
        }

        .hero-stats {
          grid-template-columns: 1fr;
        }

        .metric-value-row {
          align-items: center;
        }

        .value {
          font-size: 3rem;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <article class="hero-copy">
          <div class="eyebrow">AirKorea Live</div>
          <h1>${escapeHtml(result.measurement.stationName)} 대기 스냅샷</h1>
          <p class="lede">${escapeHtml(getHeroDescription(overallGrade))}</p>
          <div class="meta-row">
            <div class="meta-pill">측정시각 ${escapeHtml(result.measurement.dataTime || "정보 없음")}</div>
            <div class="meta-pill">확인시각 ${escapeHtml(result.checkedAt)}</div>
            <div class="meta-pill">
              ${result.shouldNotify ? "알림 기준 초과 감지" : "알림 기준 이내"}
            </div>
          </div>
        </article>

        <article class="hero-panel ${overallToneClass}">
          <div class="label">Overall status</div>
          <div class="hero-grade">
            ${escapeHtml(getGradeEmoji(overallGrade))} ${escapeHtml(toKoreanGrade(overallGrade))}
          </div>
          <p class="hero-summary">${escapeHtml(leadMessage)}</p>
          <dl class="hero-stats">
            <div>
              <dt>통합지수</dt>
              <dd>${escapeHtml(displayMetric(result.measurement.khaiValue))}</dd>
            </div>
            <div>
              <dt>감지 상태</dt>
              <dd>${escapeHtml(result.exceeded.length ? `${result.exceeded.length}개 항목 주의` : "안정적")}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section class="metric-grid">
        ${renderMetricCard(
          "미세먼지",
          "PM10",
          result.measurement.pm10Value,
          result.measurement.pm10Grade,
          "pm10"
        )}
        ${renderMetricCard(
          "초미세먼지",
          "PM2.5",
          result.measurement.pm25Value,
          result.measurement.pm25Grade,
          "pm25"
        )}
      </section>

      <section class="detail-grid">
        <article class="card detail-card">
          <div class="label">Current snapshot</div>
          <h2>지금 감지된 상태</h2>
          <p>${escapeHtml(exceededSummary)}</p>
          <p>
            기준값은 PM2.5 ${result.thresholds.pm25}, PM10 ${result.thresholds.pm10}입니다.
          </p>
        </article>
        <article class="card detail-card">
          <div class="label">Behavior</div>
          <h2>페이지와 알림의 차이</h2>
          <p>이 화면은 새로고침해도 알림을 보내지 않습니다.</p>
          <p>자동 알림은 매일 스케줄 실행 또는 <code>POST /api/run</code> 호출 시 발송됩니다.</p>
        </article>
        <article class="card detail-card">
          <div class="label">Schedule</div>
          <h2>실행 주기</h2>
          <p><code>0 23 * * *</code> 설정은 한국 시간 기준 매일 오전 8시 실행입니다.</p>
          <ul>
            <li><code>GET /api/status</code>: 실시간 JSON 조회</li>
            <li><code>POST /api/run</code>: 수동 체크와 알림 발송</li>
          </ul>
        </article>
      </section>
    </main>
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
      :root {
        color-scheme: light;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(196, 61, 53, 0.18), transparent 28%),
          linear-gradient(180deg, #f5f7fb, #eef1f7 60%, #f8ede3);
        color: #172033;
        font-family: "Avenir Next", "SUIT Variable", "Pretendard Variable", "Apple SD Gothic Neo",
          "Noto Sans KR", sans-serif;
      }

      article {
        max-width: 620px;
        margin: 24px;
        padding: 30px;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(23, 32, 51, 0.1);
        box-shadow: 0 18px 50px rgba(30, 41, 59, 0.1);
      }

      h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 5vw, 3rem);
        letter-spacing: -0.04em;
      }

      p {
        margin: 0;
        color: #5f6b80;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <article>
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
    <div class="metric-top">
      <div>
        <div class="label">${escapeHtml(shortLabel)}</div>
        <div class="metric-name">${escapeHtml(label)}</div>
      </div>
      <div class="metric-grade">${escapeHtml(getGradeEmoji(grade))} ${escapeHtml(toKoreanGrade(grade))}</div>
    </div>
    <div class="metric-value-row">
      <div class="value">${escapeHtml(displayMetric(value))}</div>
      <div class="unit">㎍/㎥</div>
    </div>
    <div class="range">현재 등급 구간 ${escapeHtml(range ?? "정보 없음")}</div>
  </article>`;
}

function displayMetric(value: number | null): string {
  return value === null ? "N/A" : String(value);
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

  if (pm10Severity === pm25Severity) {
    return `미세먼지와 초미세먼지가 모두 ${toKoreanGrade(result.measurement.pm10Grade)} 수준입니다.`;
  }

  if (pm25Severity > pm10Severity) {
    return `초미세먼지가 더 강하게 나타나고 있습니다. 작은 입자 위주로 먼저 체크해 두면 좋습니다.`;
  }

  return "미세먼지가 더 강하게 나타나고 있습니다. 시야나 답답함이 느껴지면 외출 시간을 줄여보세요.";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
