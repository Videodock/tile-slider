export const getCircularIndex = (index: number, length: number) => ((index % length) + length) % length;

export function interpolate(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}
