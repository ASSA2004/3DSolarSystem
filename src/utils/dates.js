export const J2000 = 2451545;
export const MIN_JD = 2378496.5; // 1800-01-01 00:00 UTC
export const MAX_JD = 2470171.5; // 2050-12-31 00:00 UTC
export function dateToJulian(value) {
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(ms)) throw new RangeError("Invalid date");
  return ms / 86400000 + 2440587.5;
}
export function julianToDate(jd) {
  if (!Number.isFinite(jd)) throw new RangeError("Invalid Julian date");
  return new Date((jd - 2440587.5) * 86400000);
}
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value)
    return null;
  const jd = dateToJulian(new Date(ms));
  return jd >= MIN_JD && jd <= MAX_JD ? jd : null;
}
