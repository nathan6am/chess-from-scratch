export function coinflip<T>(a: T, b: T): T {
  return Math.random() < 0.5 ? a : b;
}
