import React, { useCallback, useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessWithEngine";
import Board from "./Board";

import * as Chess from "@/util/chess";
import _ from "lodash";
import useStockfish from "@/hooks/useStockfish";
export default function GameLocal() {
  const { game, move, engineMove } = useChessLocal("w");
  const [orientation, setOrientation] = useState<Chess.Color>("w");
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

  // useEffect(() => {
  //   (async () => {
  //     await new Promise((r) => setTimeout(r, 2000));
  //     if (engineMove && game.activeColor === "b") {
  //       const max = game.legalMoves.length;
  //       const getRandomInt = (max: number) => {
  //         return Math.floor(Math.random() * max);
  //       };
  //       const move = game.legalMoves[getRandomInt(max)];
  //       if (move) onMove(move);
  //     }
  //   })();
  // }, [engineMove]);

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
      <button
        onClick={() => {
          const max = game.legalMoves.length;
          function getRandomInt(max: number) {
            return Math.floor(Math.random() * max);
          }
          const move = game.legalMoves[getRandomInt(max)];
          if (move) onMove(move);
        }}
      >
        move something
      </button>
      <Board
        orientation={orientation}
        legalMoves={game.legalMoves}
        showHighlights={true}
        showTargets={true}
        pieces={game.board}
        animationSpeed="normal"
        lastMove={game.lastMove}
        activeColor={game.activeColor}
        moveable="w"
        preMoveable={false}
        autoQueen={true}
        onMove={onMove}
        onPremove={() => {}}
      />
    </>
  );
}
