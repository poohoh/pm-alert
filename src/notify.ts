import type { CheckResult, Env } from "./types";

export async function sendAlert(env: Env, result: CheckResult): Promise<void> {
  if (!env.NTFY_TOPIC) {
    throw new Error("Missing NTFY_TOPIC");
  }

  const baseUrl = stripTrailingSlash(env.NTFY_BASE_URL ?? "https://ntfy.sh");
  const url = `${baseUrl}/${encodeURIComponent(env.NTFY_TOPIC)}`;
  const title = `PM alert: ${result.measurement.stationName}`;
  const body = createMessageBody(result);

  const response = await fetch(url, {
    body,
    headers: {
      Priority: result.exceeded.length > 1 ? "urgent" : "high",
      Tags: "warning,mask,wind_face",
      Title: title
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`ntfy request failed with ${response.status}`);
  }
}

function createMessageBody(result: CheckResult): string {
  const lines = [
    `${result.measurement.stationName} air quality is above your alert threshold.`,
    "",
    `Measured at: ${result.measurement.dataTime || "unknown"}`,
    `PM2.5: ${displayMetric(result.measurement.pm25Value)} (alert at ${result.thresholds.pm25})`,
    `PM10: ${displayMetric(result.measurement.pm10Value)} (alert at ${result.thresholds.pm10})`
  ];

  if (result.measurement.khaiValue !== null) {
    lines.push(`CAI: ${result.measurement.khaiValue}`);
  }

  if (result.exceeded.length > 0) {
    lines.push("", `Exceeded: ${result.exceeded.map((item) => item.label).join(", ")}`);
  }

  lines.push("", "Consider a mask before heading out.");
  return lines.join("\n");
}

function displayMetric(value: number | null): string {
  return value === null ? "N/A" : String(value);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
