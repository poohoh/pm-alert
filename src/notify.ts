import { getGradeEmoji, getGradeRange, toKoreanGrade } from "./air-quality";
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
