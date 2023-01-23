export function coinflip<T>(a: T, b: T): T {
  return Math.random() < 0.5 ? a : b;
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function escapeSpecialChars(string: string): string {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
