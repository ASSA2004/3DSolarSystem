import { keplerPosition } from "./orbits.js";
export const AU_KM = 149597870.7;
export const LIGHT_KM_S = 299792.458;
export const TAU = Math.PI * 2;
export type OrbitBody = {
  id?: string;
  distanceAu: number;
  orbitalDays: number;
  phase?: number;
};
// Circular reference helpers teach orbital periods. Planet positions use JPL elements.
export function orbitalAngle(body: OrbitBody, days: number): number {
  return (
    (body.phase ?? 0) +
    (body.orbitalDays > 0 ? ((days / body.orbitalDays) % 1) * TAU : 0)
  );
}
export function positionAu(
  body: OrbitBody,
  days: number,
): { x: number; y: number; z: number } {
  if (body.id) return keplerPosition(body.id, days);
  const angle = orbitalAngle(body, days);
  return {
    y: 0,
    x: Math.cos(angle) * body.distanceAu,
    z: -Math.sin(angle) * body.distanceAu,
  };
}
export function separationAu(a: OrbitBody, b: OrbitBody, days: number): number {
  const p = positionAu(a, days),
    q = positionAu(b, days);
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}
export function lightMinutes(distanceAu: number): number {
  return (distanceAu * AU_KM) / LIGHT_KM_S / 60;
}
export function orbitalSpeed(distanceAu: number, orbitalDays: number): number {
  return orbitalDays > 0
    ? (TAU * distanceAu * AU_KM) / (orbitalDays * 86400)
    : 0;
}
export function orbitProgress(body: OrbitBody, days: number): number {
  return body.orbitalDays > 0 ? (((days / body.orbitalDays) % 1) + 1) % 1 : 0;
}
export function validDays(value: unknown): number | null {
  if (value === "" || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1000000 ? n : null;
}
