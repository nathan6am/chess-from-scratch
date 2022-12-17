export function initialize(stockfish: Worker) {
  stockfish.postMessage("uci");
}

export function limitStrength(value: boolean, stockfish: Worker) {
  stockfish.postMessage(`setoption name UCI_LimitStrength value ${value}`);
}
export function setSkillLevel(value: number, stockfish: Worker) {
  if (value < 0 || value > 20)
    throw new Error(
      `Value: ${value} is outside the range for option SkillLevel - please enter a value between 0 and 20`
    );
}
