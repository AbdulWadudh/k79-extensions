const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.345, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatRelativeTime(value?: string): string {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeTime.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "unknown";
}

export function formatUpdatedAt(value?: string): string {
  if (!value) return "No update timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No update timestamp";
  return `Updated ${formatRelativeTime(value)}`;
}
