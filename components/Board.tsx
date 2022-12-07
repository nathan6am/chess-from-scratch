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

  const onSelectTarget = useCallback(
    (end: Square) => {
      if (selectedPiece?.targets?.includes(end)) {
        const targetMove = game.legalMoves.find(
          (move) => move.start === selectedPiece.square && move.end === end
        );
        if (targetMove) {
          move(targetMove);
          setSelectedPiece(null);
        }
      }
    },
    [selectedPiece]
  );
  const onDrop = useCallback(
    (start: Square) => {
      if (x > 7 || x < 0 || y > 7 || y < 0) {
        return;
      } else {
        const mouseOverSquare = chess.toSquare([x, 7 - y]);

        if (selectedPiece?.targets?.includes(mouseOverSquare)) {
          const targetMove = game.legalMoves.find(
            (move) => move.start === start && move.end === mouseOverSquare
          );

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
                onSelectTarget={onSelectTarget}
                key={square}
                square={square}
                hasPiece={game.gameState.position.has(square)}
                isTarget={selectedPiece?.targets.includes(square) || false}
                isLastMove={false}
                color={getSquareColor(square)}
                isSelected={selectedPiece?.square === square}
                isHovered={chess.toSquare([x, 7 - y]) === square}
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
                  disabled={piece.color !== game.gameState.activeColor}
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
  onSelectTarget: any;
  isHovered: boolean;
}

function BoardSquare({
  hasPiece,
  isTarget,
  isSelected,
  onSelectTarget,
  square,
  isLastMove,
  isPremoved,
  color,
  isHovered,
}: SquareProps) {
  return (
    <div
      className={styles.square}
      style={{ backgroundColor: color === "w" ? "#FFFDD0" : "#015d2d" }}
    >
      <div
        onClick={() => {
          if (isTarget) {
            onSelectTarget(square);
          }
        }}
        className={`${
          isTarget ? "target" + (isHovered ? " target-hover" : "") : ""
        }${isSelected ? "selected" : ""}`}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
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
  disabled: boolean;
}
//function RenderPiece({ type, color, square }) {}
function TestPiece({ piece, setSelectedPiece, onDrop, disabled }: PieceProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [dragging, setDragging] = useState(false);
  if (!piece.square) return <></>;
  const coordinates = chess.squareToCoordinates(piece.square);
  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={{ x: position[0], y: position[1] }}
      onMouseDown={(e) => {
        setDragging(true);
        const pointer = [e.clientX, e.clientY];
        const piecePos = [
          nodeRef?.current?.getBoundingClientRect().x,
          nodeRef?.current?.getBoundingClientRect().y,
        ];

        setPosition([
          pointer[0] - ((piecePos[0] || 0) + 40),
          pointer[1] - ((piecePos[1] || 0) + 40),
        ]);

        setSelectedPiece(piece);
      }}
      onStop={() => {
        onDrop(piece.square);
        setPosition([0, 0]);
        setDragging(false);
      }}
    >
      <div
        style={{
          cursor: dragging ? "grabbing" : "grab",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 80,
          height: 80,
          pointerEvents: disabled ? "none" : "auto",
          position: "absolute",
          bottom: coordinates[1] * 80,
          left: coordinates[0] * 80,
          zIndex: dragging ? 100 : 10,
        }}
        ref={nodeRef}
      >
        <img
          className={styles.piece}
          src={`/assets/${piece.color}${piece.type}.png`}
          height={69}
          width={69}
          style={{ pointerEvents: "none" }}
        />
      </div>
    </Draggable>
  );
}
