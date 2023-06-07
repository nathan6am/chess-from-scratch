declare module "*";
declare module "stockfish";
declare module "glicko2";
declare global {
  interface Array<T> {
    findLastIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;
  }
}
