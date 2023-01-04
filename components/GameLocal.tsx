import React, { useCallback, useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/Game/Board";
import EvalBar from "./Game/EvalBar";
import * as Chess from "@/util/chess";
import _ from "lodash";
import useStockfish from "@/hooks/useStockfish";
import MoveHistory from "@/components/Game/MoveHistory";
import { positionToBoard } from "@/util/chess";
import useLocalEval from "@/hooks/useLocalEval";
export default function GameLocal() {
  const { game, move } = useChessLocal();
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const [boardMoveIdx, setBoardMoveIdx] = useState<[number, number] | null>(null);
  const [liveBoard, setLiveBoard] = useState(game.board);
  const { isReady, error, evaluation, inProgress, finished, getEvaluation } = useLocalEval();
  useEffect(() => {
    setBoardMoveIdx(null);
  }, [game.moveHistory]);
  //useStockfish();
  useEffect(() => {
    if (boardMoveIdx === null) {
      setLiveBoard(game.board);
    } else if (boardMoveIdx[0] === -1) {
      let start = Chess.fenToGameState(game.config.startPosition);
      if (start) {
        const board = positionToBoard(start.position);
        setLiveBoard(board);
      } else {
        throw new Error("invalid start pos");
      }
    } else {
      const board = game.moveHistory[boardMoveIdx[0]][boardMoveIdx[1]]?.board;
      if (board) setLiveBoard(board);
    }
  }, [boardMoveIdx, game.board]);

  const stepBackwards = useCallback(() => {
    setBoardMoveIdx((current) => {
      if (current === null) {
        const lastMoveIdx = game.moveHistory.length - 1;
        if (lastMoveIdx < 0) return null;
        if (game.moveHistory[lastMoveIdx] && game.moveHistory[lastMoveIdx][1]) {
          return [lastMoveIdx, 0];
        } else {
          return [lastMoveIdx - 1, 1];
        }
      } else {
        return current[1] === 0 ? [current[0] - 1, 1] : [current[0], 0];
      }
    });
  }, [game.moveHistory]);

  const stepForwards = useCallback(() => {
    setBoardMoveIdx((current) => {
      if (current === null) return null;
      if (game.moveHistory.length - 1 === current[0]) return null;
      return current[1] === 1 ? [current[0] + 1, 0] : [current[0], 1];
    });
  }, [game.moveHistory]);

  const flipBoard = () => {
    setOrientation((cur) => (cur === "w" ? "b" : "w"));
  };

  //useStockfish();
  const onMove = useCallback(
    (attemptedMove: Chess.Move) => {
      //verify move
      if (game.legalMoves.some((legalMove) => _.isEqual(attemptedMove, legalMove))) {
        move(attemptedMove);
      }
    },
    [game, move]
  );

  useEffect(() => {
    if (!isReady) return;
    console.log("getting eval");
    getEvaluation({ depth: 20, fen: game.fen, useNNUE: true });
  }, [game.fen]);

  return (
    <div className="flex flex-col h-full w-full justify-center">
      <button onClick={stepForwards}>Forward</button>
      <button onClick={stepBackwards}>Back</button>
      <p>eval: {evaluation && evaluation.score?.value}</p>
      <p>depth: {evaluation && evaluation.depth}</p>
      <div className="flex flex-row items-center">
        <EvalBar
          scoreType={evaluation?.score?.type || "cp"}
          value={evaluation?.score?.value || 0}
          orientation={orientation}
          scale={9.06}
          key={orientation}
        />
        <Board
          orientation={orientation}
          legalMoves={game.legalMoves}
          showHighlights={true}
          showTargets={true}
          pieces={boardMoveIdx ? liveBoard : game.board}
          animationSpeed="normal"
          lastMove={
            !boardMoveIdx || boardMoveIdx[0] === -1
              ? game.lastMove
              : game.moveHistory[boardMoveIdx[0]]
              ? game.moveHistory[boardMoveIdx[0]][boardMoveIdx[1]]?.move
              : game.lastMove
          }
          activeColor={game.activeColor}
          moveable={"both"}
          preMoveable={false}
          autoQueen={true}
          onMove={onMove}
          onPremove={() => {}}
        />
        <MoveHistory moveHistory={game.moveHistory} usePieceIcons={true} onFlipBoard={flipBoard} />
      </div>
    </div>
  );
}
