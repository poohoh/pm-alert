import type { AirQualitySnapshot, Env, HistoryPoint, Measurement } from "./types";

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

export async function fetchAirQualitySnapshot(env: Env): Promise<AirQualitySnapshot> {
  if (!env.AIRKOREA_SERVICE_KEY) {
    throw new Error("Missing AIRKOREA_SERVICE_KEY");
  }

  if (!env.AIRKOREA_STATION_NAME) {
    throw new Error("Missing AIRKOREA_STATION_NAME");
  }

  const query = new URLSearchParams({
    dataTerm: "DAILY",
    numOfRows: "48",
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

  const measurement = {
    dataTime: item.dataTime ?? "",
    khaiValue: parseMetric(item.khaiValue),
    pm10Grade: gradeLabel(item.pm10Grade1h),
    pm10Value: parseMetric(item.pm10Value),
    pm25Grade: gradeLabel(item.pm25Grade1h),
    pm25Value: parseMetric(item.pm25Value),
    stationName: item.stationName ?? env.AIRKOREA_STATION_NAME
  };

  return {
    history: buildTodayHistory(payload.response?.body?.items ?? []),
    measurement
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

function buildTodayHistory(items: AirKoreaItem[]): HistoryPoint[] {
  const normalized = items
    .map((item) => normalizeHistoryItem(item))
    .filter((item): item is NormalizedHistoryPoint => item !== null);

  if (normalized.length === 0) {
    return [];
  }

  const latestDateKey = normalized[0].dateKey;
  const latestHour = normalized[0].hour;
  const currentDayPoints = normalized.filter((item) => item.dateKey === latestDateKey);
  const pointByHour = new Map(currentDayPoints.map((item) => [item.hour, item]));

  const history: HistoryPoint[] = [];

  for (let hour = 0; hour <= latestHour; hour += 1) {
    const point = pointByHour.get(hour);
    history.push({
      dataTime: point?.dataTime ?? `${latestDateKey} ${String(hour).padStart(2, "0")}:00`,
      pm10Value: point?.pm10Value ?? null,
      pm25Value: point?.pm25Value ?? null,
      timeLabel: `${String(hour).padStart(2, "0")}:00`
    });
  }

  return history;
}

interface NormalizedHistoryPoint extends HistoryPoint {
  dateKey: string;
  hour: number;
}

function normalizeHistoryItem(item: AirKoreaItem): NormalizedHistoryPoint | null {
  const normalizedTime = normalizeDataTime(item.dataTime);

  if (!normalizedTime) {
    return null;
  }

  return {
    dataTime: item.dataTime ?? normalizedTime.displayTime,
    dateKey: normalizedTime.dateKey,
    hour: normalizedTime.hour,
    pm10Value: parseMetric(item.pm10Value),
    pm25Value: parseMetric(item.pm25Value),
    timeLabel: normalizedTime.timeLabel
  };
}

function normalizeDataTime(dataTime?: string): {
  dateKey: string;
  displayTime: string;
  hour: number;
  timeLabel: string;
} | null {
  if (!dataTime) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(dataTime);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const normalized = new Date(Date.UTC(year, month - 1, day, hour === 24 ? 24 : hour, minute));
  const normalizedYear = normalized.getUTCFullYear();
  const normalizedMonth = String(normalized.getUTCMonth() + 1).padStart(2, "0");
  const normalizedDay = String(normalized.getUTCDate()).padStart(2, "0");
  const normalizedHour = normalized.getUTCHours();
  const timeLabel = `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    dateKey: `${normalizedYear}-${normalizedMonth}-${normalizedDay}`,
    displayTime: `${normalizedYear}-${normalizedMonth}-${normalizedDay} ${timeLabel}`,
    hour: normalizedHour,
    timeLabel
  };
}
