import React, { useCallback, useRef, useState } from "react";
import { Color, Square, Position, Piece } from "@/util/chess/ChessTypes";
import useRelativeMousePosition from "@/hooks/useRelativeMousePosition";
import usePointerCoordinates from "@/hooks/usePointerCoordinates";
import styles from "@/styles/Board.module.scss";
import { boardMap } from "@/util/chess/FenParser";
import Draggable from "react-draggable";
import { motion, useDragControls } from "framer-motion";
import * as chess from "@/util/chess/Chess";
import useChessLocal, { PieceWithMetadata } from "@/hooks/useChessLocal";

interface Props {
  orientation?: Color;
  position?: Position;
  activePiece?: Square;
  targets?: Array<Square>;
  activeColor?: Color;
}

function getSquareColor(square: Square): Color {
  const coordinates = chess.squareToCoordinates(square);
  const testColor = coordinates[0] % 2 === coordinates[1] % 2;
  return testColor ? "b" : "w";
}
export default function Board({
  orientation,
  position,
  activePiece,
  targets,
  activeColor,
}: Props) {
  const {
    ref,
    position: { x, y },
  } = usePointerCoordinates();

  const { move, game } = useChessLocal();
  const [selectedPiece, setSelectedPiece] = useState<PieceWithMetadata | null>(
    null
  );
  const onDrop = useCallback(
    (start: Square) => {
      if (x > 7 || x < 0 || y > 7 || y < 0) {
        return;
      } else {
        const mouseOverSquare = chess.toSquare([x, 7 - y]);
        console.log(mouseOverSquare);
        console.log(selectedPiece?.targets);
        if (selectedPiece?.targets?.includes(mouseOverSquare)) {
          const targetMove = game.legalMoves.find(
            (move) => move.start === start && move.end === mouseOverSquare
          );
          console.log(targetMove);
          if (targetMove) {
            move(targetMove);
            setSelectedPiece(null);
          }
        }
      }
    },
    [x, y]
  );
  return (
    <>
      <p>{`x:${x}y:${y}${selectedPiece?.type}`}</p>
      <div style={{ minWidth: "90vw" }}>
        <div className={styles.board} ref={ref}>
          {boardMap.map((row) => {
            return row.map((square) => (
              <BoardSquare
                key={square}
                square={square}
                hasPiece={game.gameState.position.has(square)}
                isTarget={selectedPiece?.targets.includes(square) || false}
                isLastMove={false}
                color={getSquareColor(square)}
                isSelected={selectedPiece?.square === square}
              />
            ));
          })}
          {game.boardState &&
            game.boardState.map((piece) => {
              const keyExtractor = () => {
                return `${piece.previousSquare || "-"}:${piece.square}`;
              };
              return (
                <TestPiece
                  onDrop={onDrop}
                  setSelectedPiece={setSelectedPiece}
                  key={keyExtractor()}
                  piece={piece}
                />
              );
            })}
        </div>
      </div>
    </>
  );
}

interface SquareProps {
  hasPiece: boolean;
  isTarget: boolean;
  isSelected: boolean;
  square: Square;
  isLastMove: boolean;
  isPremoved?: boolean;
  color: Color;
}

function BoardSquare({
  hasPiece,
  isTarget,
  isSelected,
  square,
  isLastMove,
  isPremoved,
  color,
}: SquareProps) {
  return (
    <div
      className={styles.square}
      style={{ backgroundColor: color === "w" ? "#FFFDD0" : " #9CAF88" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: isSelected
            ? "rgba(255, 0, 255, 0.5)"
            : "transparent",
        }}
      >
        {isTarget && <div className={hasPiece ? "ring" : "dot"} />}
      </div>
    </div>
  );
}

interface PieceProps {
  piece: PieceWithMetadata;
  setSelectedPiece: any;
  onDrop: any;
}
//function RenderPiece({ type, color, square }) {}
function TestPiece({ piece, setSelectedPiece, onDrop }: PieceProps) {
  if (!piece.square) return <></>;
  const coordinates = chess.squareToCoordinates(piece.square);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  return (
    <Draggable
      position={{ x: position[0], y: position[1] }}
      onMouseDown={(e) => {
        const pointer = [e.clientX, e.clientY];
        const piecePos = [
          nodeRef?.current?.getBoundingClientRect().x,
          nodeRef?.current?.getBoundingClientRect().y,
        ];
        console.log(pointer);

        setPosition([
          pointer[0] - ((piecePos[0] || 0) + 40),
          pointer[1] - ((piecePos[1] || 0) + 40),
        ]);
        console.log(piece);
        setSelectedPiece(piece);
      }}
      onStop={() => {
        onDrop(piece.square);
        setPosition([0, 0]);
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: coordinates[1] * 80,
          left: coordinates[0] * 80,
        }}
        ref={nodeRef}
      >
        <img
          src={`/assets/${piece.color}${piece.type}.png`}
          height={80}
          width={80}
          style={{ pointerEvents: "none" }}
        />
      </div>
    </Draggable>
  );
}
