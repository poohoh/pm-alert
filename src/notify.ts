import type { CheckResult, Env } from "./types";

export async function sendAlert(env: Env, result: CheckResult): Promise<void> {
  if (!env.NTFY_TOPIC) {
    throw new Error("Missing NTFY_TOPIC");
  }

  const baseUrl = stripTrailingSlash(env.NTFY_BASE_URL ?? "https://ntfy.sh");
  const url = `${baseUrl}/${encodeURIComponent(env.NTFY_TOPIC)}`;
  const title = `오늘 ${result.measurement.stationName} 미세먼지`;
  const body = createMessageBody(result);

  const response = await fetch(url, {
    body,
    headers: {
      Priority: result.exceeded.length > 0 ? "high" : "default",
      Title: title
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`ntfy request failed with ${response.status}`);
  }
}

function createMessageBody(result: CheckResult): string {
  return [
    createMetricLine("미세먼지", result.measurement.pm10Grade, result.measurement.pm10Value, "pm10"),
    createMetricLine("초미세먼지", result.measurement.pm25Grade, result.measurement.pm25Value, "pm25")
  ].join("\n");
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function displayMetric(value: number | null): string {
  return value === null ? "N/A" : String(value);
}

function createMetricLine(
  label: string,
  grade: string | null,
  value: number | null,
  metricType: "pm10" | "pm25"
): string {
  const range = getGradeRange(metricType, grade);
  const parts = [`${getGradeEmoji(grade)} ${label} ${toKoreanGrade(grade)} (${displayMetric(value)})`];

  if (range) {
    parts.push(`(${range})`);
  }

  return parts.join(" ");
}

function toKoreanGrade(grade: string | null): string {
  switch (grade) {
    case "Good":
      return "좋음";
    case "Moderate":
      return "보통";
    case "Bad":
      return "나쁨";
    case "Very bad":
      return "매우 나쁨";
    default:
      return "정보 없음";
  }
}

function getGradeEmoji(grade: string | null): string {
  switch (getGradeSeverity(grade)) {
    case 1:
      return "🟢";
    case 2:
      return "🟡";
    case 3:
      return "🔴";
    case 4:
      return "🚨🚨";
    default:
      return "❔";
  }
}

function getGradeSeverity(grade: string | null): number {
  switch (grade) {
    case "Good":
      return 1;
    case "Moderate":
      return 2;
    case "Bad":
      return 3;
    case "Very bad":
      return 4;
    default:
      return 0;
  }
}

function getGradeRange(metricType: "pm10" | "pm25", grade: string | null): string | null {
  if (metricType === "pm10") {
    switch (grade) {
      case "Good":
        return "0 ~ 30";
      case "Moderate":
        return "31 ~ 80";
      case "Bad":
        return "81 ~ 150";
      case "Very bad":
        return "151+";
      default:
        return null;
    }
  }

  switch (grade) {
    case "Good":
      return "0 ~ 15";
    case "Moderate":
      return "16 ~ 35";
    case "Bad":
      return "36 ~ 75";
    case "Very bad":
      return "76+";
    default:
      return null;
  }
}
