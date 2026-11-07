/** "hace 12 s", "hace 3 min", "hace 2 h", "hace 4 d". */
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function initials(name: string, fallback = "?"): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase();
  return (parts[0]?.[0] ?? fallback).toUpperCase();
}
