export type MetricType = "pm10" | "pm25";

const GRADE_ORDER = ["Good", "Moderate", "Bad", "Very bad"] as const;

export interface GradeCriteriaRow {
  emoji: string;
  label: string;
  pm10Range: string;
  pm25Range: string;
}

export function toKoreanGrade(grade: string | null): string {
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

export function getGradeEmoji(grade: string | null): string {
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

export function getGradeSeverity(grade: string | null): number {
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

export function getGradeRange(metricType: MetricType, grade: string | null): string | null {
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

export function getGradeCriteriaRows(): GradeCriteriaRow[] {
  return GRADE_ORDER.map((grade) => ({
    emoji: getGradeEmoji(grade),
    label: toKoreanGrade(grade),
    pm10Range: getGradeRange("pm10", grade) ?? "-",
    pm25Range: getGradeRange("pm25", grade) ?? "-"
  }));
}
