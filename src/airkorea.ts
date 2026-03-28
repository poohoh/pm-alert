import type { Env, Measurement } from "./types";

const AIRKOREA_ENDPOINT =
  "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";

interface AirKoreaItem {
  dataTime?: string;
  khaiValue?: string;
  pm10Grade1h?: string;
  pm10Value?: string;
  pm25Grade1h?: string;
  pm25Value?: string;
  stationName?: string;
}

interface AirKoreaResponse {
  response?: {
    body?: {
      items?: AirKoreaItem[];
    };
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
  };
}

export async function fetchLatestMeasurement(env: Env): Promise<Measurement> {
  if (!env.AIRKOREA_SERVICE_KEY) {
    throw new Error("Missing AIRKOREA_SERVICE_KEY");
  }

  if (!env.AIRKOREA_STATION_NAME) {
    throw new Error("Missing AIRKOREA_STATION_NAME");
  }

  const query = new URLSearchParams({
    dataTerm: "DAILY",
    numOfRows: "1",
    pageNo: "1",
    returnType: "json",
    stationName: env.AIRKOREA_STATION_NAME,
    ver: env.AIRKOREA_API_VERSION ?? "1.3"
  });

  const url = `${AIRKOREA_ENDPOINT}?${query.toString()}&serviceKey=${formatServiceKey(
    env.AIRKOREA_SERVICE_KEY
  )}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`AirKorea request failed with ${response.status}`);
  }

  const payload = (await response.json()) as AirKoreaResponse;
  const resultCode = payload.response?.header?.resultCode;

  if (resultCode && resultCode !== "00") {
    const resultMessage = payload.response?.header?.resultMsg ?? "unknown error";
    throw new Error(`AirKorea error ${resultCode}: ${resultMessage}`);
  }

  const item = payload.response?.body?.items?.[0];

  if (!item) {
    throw new Error(`No measurement data returned for station ${env.AIRKOREA_STATION_NAME}`);
  }

  return {
    dataTime: item.dataTime ?? "",
    khaiValue: parseMetric(item.khaiValue),
    pm10Grade: gradeLabel(item.pm10Grade1h),
    pm10Value: parseMetric(item.pm10Value),
    pm25Grade: gradeLabel(item.pm25Grade1h),
    pm25Value: parseMetric(item.pm25Value),
    stationName: item.stationName ?? env.AIRKOREA_STATION_NAME
  };
}

function formatServiceKey(serviceKey: string): string {
  return serviceKey.includes("%") ? serviceKey : encodeURIComponent(serviceKey);
}

function parseMetric(value?: string): number | null {
  if (!value || value === "-" || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function gradeLabel(value?: string): string | null {
  switch (value) {
    case "1":
      return "Good";
    case "2":
      return "Moderate";
    case "3":
      return "Bad";
    case "4":
      return "Very bad";
    default:
      return null;
  }
}
