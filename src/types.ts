export interface Env {
  ADMIN_TOKEN?: string;
  AIRKOREA_API_VERSION?: string;
  AIRKOREA_SERVICE_KEY: string;
  AIRKOREA_STATION_NAME: string;
  ALERT_PM10?: string;
  ALERT_PM25?: string;
  NTFY_BASE_URL?: string;
  NTFY_TOPIC?: string;
}

export interface Thresholds {
  pm10: number;
  pm25: number;
}

export interface Measurement {
  dataTime: string;
  khaiValue: number | null;
  pm10Grade: string | null;
  pm10Value: number | null;
  pm25Grade: string | null;
  pm25Value: number | null;
  stationName: string;
}

export interface ExceededMetric {
  label: "PM10" | "PM2.5";
  threshold: number;
  value: number;
}

export interface CheckResult {
  checkedAt: string;
  exceeded: ExceededMetric[];
  measurement: Measurement;
  notificationSent: boolean;
  shouldNotify: boolean;
  thresholds: Thresholds;
}
