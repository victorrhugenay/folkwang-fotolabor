/**
 * Formats a date string from YYYY-MM-DD to DD.MM.YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return "–";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}