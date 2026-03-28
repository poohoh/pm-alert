export type MetricType = "pm10" | "pm25";

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
