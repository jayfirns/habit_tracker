export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}
