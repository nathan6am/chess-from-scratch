import React, { useCallback, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "./Board";
import * as Chess from "@/util/chess";
import _ from "lodash";
export default function GameLocal() {
  const { game, move } = useChessLocal();
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const onMove = useCallback(
    (attemptedMove: Chess.Move) => {
      //verify move
      if (game.legalMoves.some((legalMove) => _.isEqual(attemptedMove, legalMove))) {
        move(attemptedMove);
      }
    },
    [game, move]
  );
  return (
    <>
      <p>{game.outcome?.by}</p>
      <button
        onClick={() => {
          setOrientation((current) => (current === "b" ? "w" : "b"));
        }}
      >
        Flip
      </button>
      <Board
        orientation={orientation}
        legalMoves={game.legalMoves}
        showHighlights={true}
        showTargets={true}
        pieces={game.board}
        animationSpeed="fast"
        lastMove={game.lastMove}
        activeColor={game.activeColor}
        moveable="both"
        preMoveable={false}
        autoQueen={true}
        onMove={onMove}
        onPremove={() => {}}
      />
    </>
  );
}
