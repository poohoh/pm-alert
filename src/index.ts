import { fetchLatestMeasurement } from "./airkorea";
import { sendAlert } from "./notify";
import type { CheckResult, Env, ExceededMetric, Thresholds } from "./types";
import { renderDashboard, renderErrorDashboard } from "./web";

const DEFAULT_THRESHOLDS: Thresholds = {
  pm10: 81,
  pm25: 36
};

export default {
  async fetch(request, env): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(_controller, env): Promise<void> {
    const result = await runCheck(env, true);
    console.log(JSON.stringify(result));
  }
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/") {
    try {
      const result = await runCheck(env, false);
      return html(renderDashboard(result));
    } catch (error) {
      return html(renderErrorDashboard(toErrorMessage(error)), 500);
    }
  }

  if (request.method === "GET" && url.pathname === "/api/status") {
    try {
      const result = await runCheck(env, false);
      return json(result);
    } catch (error) {
      return json({ error: toErrorMessage(error) }, 500);
    }
  }

  if ((request.method === "GET" || request.method === "POST") && url.pathname === "/api/run") {
    if (!isAuthorized(request, url, env)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const shouldNotify = url.searchParams.get("notify") !== "0";

    try {
      const result = await runCheck(env, shouldNotify);
      return json(result);
    } catch (error) {
      return json({ error: toErrorMessage(error) }, 500);
    }
  }

  return json({ error: "Not found" }, 404);
}

async function runCheck(env: Env, sendNotification: boolean): Promise<CheckResult> {
  const thresholds = getThresholds(env);
  const measurement = await fetchLatestMeasurement(env);
  const exceeded = findExceededMetrics(measurement, thresholds);
  const shouldNotify = exceeded.length > 0;

  if (sendNotification) {
    await sendAlert(env, {
      checkedAt: formatTimestamp(new Date()),
      exceeded,
      measurement,
      notificationSent: false,
      shouldNotify,
      thresholds
    });
  }

  return {
    checkedAt: formatTimestamp(new Date()),
    exceeded,
    measurement,
    notificationSent: sendNotification,
    shouldNotify,
    thresholds
  };
}

function findExceededMetrics(
  measurement: CheckResult["measurement"],
  thresholds: Thresholds
): ExceededMetric[] {
  const exceeded: ExceededMetric[] = [];

  if (measurement.pm25Value !== null && measurement.pm25Value >= thresholds.pm25) {
    exceeded.push({
      label: "PM2.5",
      threshold: thresholds.pm25,
      value: measurement.pm25Value
    });
  }

  if (measurement.pm10Value !== null && measurement.pm10Value >= thresholds.pm10) {
    exceeded.push({
      label: "PM10",
      threshold: thresholds.pm10,
      value: measurement.pm10Value
    });
  }

  return exceeded;
}

function getThresholds(env: Env): Thresholds {
  return {
    pm10: parseThreshold(env.ALERT_PM10, DEFAULT_THRESHOLDS.pm10),
    pm25: parseThreshold(env.ALERT_PM25, DEFAULT_THRESHOLDS.pm25)
  };
}

function parseThreshold(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isAuthorized(request: Request, url: URL, env: Env): boolean {
  if (!env.ADMIN_TOKEN) {
    return true;
  }

  const headerToken = request.headers.get("x-admin-token");
  const queryToken = url.searchParams.get("token");
  return headerToken === env.ADMIN_TOKEN || queryToken === env.ADMIN_TOKEN;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8"
    },
    status
  });
}

function html(markup: string, status = 200): Response {
  return new Response(markup, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8"
    },
    status
  });
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(date);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
