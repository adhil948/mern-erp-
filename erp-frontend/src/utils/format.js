export function inr(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(2)}`;
}

export function ymd(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}
