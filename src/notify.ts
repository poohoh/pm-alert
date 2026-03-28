import type { CheckResult, Env } from "./types";

export async function sendAlert(env: Env, result: CheckResult): Promise<void> {
  if (!env.NTFY_TOPIC) {
    throw new Error("Missing NTFY_TOPIC");
  }

  const baseUrl = stripTrailingSlash(env.NTFY_BASE_URL ?? "https://ntfy.sh");
  const url = `${baseUrl}/${encodeURIComponent(env.NTFY_TOPIC)}`;
  const title = `${getAlertEmoji(result)} 오늘 ${result.measurement.stationName} 미세먼지`;
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
    `미세먼지 ${toKoreanGrade(result.measurement.pm10Grade)}`,
    `초미세먼지 ${toKoreanGrade(result.measurement.pm25Grade)}`
  ].join("\n");
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
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

function getAlertEmoji(result: CheckResult): string {
  const worstSeverity = Math.max(
    getGradeSeverity(result.measurement.pm10Grade),
    getGradeSeverity(result.measurement.pm25Grade)
  );

  switch (worstSeverity) {
    case 1:
      return "🌿";
    case 2:
      return "🙂";
    case 3:
      return "😷";
    case 4:
      return "🚨";
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
