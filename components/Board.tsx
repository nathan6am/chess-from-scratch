import React, { useCallback, useState, useEffect, useContext, useMemo, useRef } from "react";
import { SettingsContext } from "@/context/settings";
import styles from "@/styles/Board.module.scss";
import * as Chess from "@/util/chess";
import { AnimSpeedEnum } from "@/context/settings";
import usePointerCoordinates from "@/hooks/usePointerCoordinates";
import { useResizeDetector } from "react-resize-detector";
import Draggable from "react-draggable";
import Image from "next/image";

interface Props {
  orientation: Chess.Color;
  pieces: Chess.Board;
  legalMoves: Array<Chess.Move>;
  lastMove: Chess.Move | undefined | null;
  activeColor: Chess.Color;
  moveable: Chess.Color | "both";
  preMoveable: boolean;
  animationSpeed: "slow" | "fast" | "normal" | "disabled";
  showTargets: boolean;
  showHighlights: boolean;
  autoQueen: boolean;
  onMove: (move: Chess.Move) => void;
  onPremove: (start: Chess.Square, end: Chess.Square) => void;
  premoveQueue?: Array<{ start: Chess.Square; end: Chess.Square }>;
}

// Hook to track the current square of the pointer
function useCurrentSquare(orientation: Chess.Color): {
  boardRef: React.RefObject<HTMLDivElement>;
  currentSquare: Chess.Square | null;
} {
  const [currentSquare, setCurrentSquare] = useState<Chess.Square | null>(null);
  const {
    ref,
    position: { x, y },
  } = usePointerCoordinates(8);
  useEffect(() => {
    // Only accept coordinated within the board
    if (x <= 7 && x >= 0 && y <= 7 && y >= 0) {
      const coordinates: [number, number] = orientation === "w" ? [x, 7 - y] : [7 - x, y];
      setCurrentSquare(Chess.toSquare(coordinates));
    } else {
      //Set the current square to null if the pointer is outside the board
      setCurrentSquare(null);
    }
  }, [x, y, orientation]);

  return {
    boardRef: ref,
    currentSquare,
  };
}

export default function Board({
  orientation,
  pieces,
  legalMoves,
  lastMove,
  activeColor,
  moveable,
  preMoveable,
  autoQueen,
  animationSpeed,
  showTargets,
  showHighlights,
  onMove,
  onPremove,
}: Props) {
  //Get the current the app settings from the settings context
  function getSquareColor(square: Chess.Square): Chess.Color {
    const coordinates = Chess.squareToCoordinates(square);
    const testColor = coordinates[0] % 2 === coordinates[1] % 2;
    return testColor ? "b" : "w";
  }
  // Track the current square of the pointer
  const { boardRef, currentSquare } = useCurrentSquare(orientation);

  //TODO: Clear selected piece when clicking outside the board
  const [selectedPiece, setSelectedPiece] = useState<[Chess.Square, Chess.Piece] | null>(null);

  //Show Promotion Menu
  const [showPromotionMenu, setShowPromotionMenu] = useState<boolean>(false);

  /* Callback to execute when a selected piece is dropped on a square; 
  if the drop square is a valid move, it calls the passed `onMove` prop, passing it the 
  selected piece and the target square */
  const onDrop = useCallback(() => {
    if (!currentSquare || !selectedPiece) {
      return;
    } else {
      const [square, piece] = selectedPiece;

      //Just in case, guard against non moveable pieces
      if (piece.color !== moveable && moveable !== "both") return;

      //Queue premove if the piece isn't of the active turn color and do not continue
      if (piece.color !== activeColor && preMoveable) {
        onPremove(square, currentSquare);
      }

      if (piece.color !== activeColor) return;

      // Find the corresponding legal move - should be unique unless there is a promotion
      const move = legalMoves.find((move) => move.start === square && move.end === currentSquare);
      //Return if no legal move is found
      if (!move) return;

      //Call onMove if the move is not a promotion
      if (!move.promotion) onMove(move);

      // Auto promote to queen if enabled in settings, otherwise show the promotion menu
      if (move.promotion && autoQueen) {
        onMove({ ...move, promotion: "q" });
      } else if (move.promotion) {
        setShowPromotionMenu(true);
      }
      setSelectedPiece(null);
    }
  }, [currentSquare, selectedPiece, autoQueen, legalMoves, activeColor, moveable, onMove, preMoveable, onPremove]);

  /* Callback to execute when a valid target is clicked for the selected piece
  it accepts the target square as an argument and then calls the passed `onMove` prop, passing it the 
  selected piece and the target square */
  const onSelectTarget = useCallback(
    (targetSquare: Chess.Square) => {
      if (!selectedPiece) {
        return;
      } else {
        const [square, piece] = selectedPiece;

        //Just in case, guard against non moveable pieces
        if (piece.color !== moveable && moveable !== "both") return;

        //Queue premove if the piece isn't of the active turn color and do not continue
        if (piece.color !== activeColor && preMoveable) {
          onPremove(square, targetSquare);
        }

        if (piece.color !== activeColor) return;

        // Find the corresponding legal move - should be unique unless there is a promotion
        const move = legalMoves.find((move) => move.start === square && move.end === targetSquare);
        //Return if no legal move is found
        if (!move) return;

        //Call onMove if the move is not a promotion
        if (!move.promotion) onMove(move);

        // Auto promote to queen if enabled in settings, otherwise show the promotion menu
        if (move.promotion && autoQueen) {
          onMove({ ...move, promotion: "q" });
        } else if (move.promotion) {
          setShowPromotionMenu(true);
        }
        setSelectedPiece(null);
      }
    },
    [selectedPiece, autoQueen, legalMoves, activeColor, moveable, onMove, preMoveable, onPremove]
  );
  useEffect(() => {
    setSelectedPiece(null);
  }, [lastMove]);
  const clearSelection = () => {
    setSelectedPiece(null);
  };

  //Array of rows representing the squares on the board
  const boardMap = orientation === "w" ? Chess.boardMap : Chess.boardMapReverse;

  //Track the dimensions of the board/squares on resize events
  const { width } = useResizeDetector({ targetRef: boardRef });
  const squareSize = (width || 0) / 8;

  return (
    <>
      <div style={{ minWidth: "100vw" }}>
        <div className={styles.board} ref={boardRef}>
          {boardMap.map((row) =>
            row.map((square) => (
              <RenderSquare
                key={square}
                hasPiece={pieces.some((piece) => piece[0] === square)}
                isTarget={(selectedPiece && selectedPiece[1].targets?.includes(square)) || false}
                isSelected={(selectedPiece && selectedPiece[0] === square) || false}
                square={square}
                color={getSquareColor(square)}
                onSelectTarget={() => {
                  onSelectTarget(square);
                }}
                isPremoved={false}
                showTargets={showTargets}
                showHighlights={showHighlights}
                clearSelection={clearSelection}
                squareSize={squareSize}
                hovered={currentSquare === square}
                isLastMove={lastMove?.start === square || lastMove?.end === square}
              />
            ))
          )}
          {pieces.map(([square, piece]) =>
            moveable === "both" || moveable === piece.color ? (
              <Piece
                animationSpeed={AnimSpeedEnum[animationSpeed]}
                setSelectedPiece={setSelectedPiece}
                key={piece.key}
                piece={piece}
                square={square}
                disabled={
                  (moveable !== "both" && piece.color !== moveable) || (!preMoveable && piece.color !== activeColor)
                }
                orientation={orientation}
                onDrop={onDrop}
                squareSize={squareSize}
              />
            ) : (
              <StaticPiece
                piece={piece}
                square={square}
                squareSize={squareSize}
                key={piece.key}
                orientation={orientation}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}

interface SquareProps {
  squareSize: number;
  hasPiece: boolean;
  isTarget: boolean;
  isSelected: boolean;
  square: Chess.Square;
  isLastMove: boolean;
  isPremoved: boolean;
  color: Chess.Color;
  onSelectTarget: any;
  hovered: boolean;
  showTargets: boolean;
  showHighlights: boolean;
  clearSelection: () => void;
}

function RenderSquare({
  squareSize,
  isTarget,
  isSelected,
  square,
  isLastMove,
  isPremoved,
  hasPiece,
  color,
  onSelectTarget,
  hovered,
  showTargets,
  showHighlights,
  clearSelection,
}: SquareProps) {
  return (
    <div
      onClick={() => {
        if (isTarget) onSelectTarget();
      }}
      className={`${styles.square} ${color === "w" ? styles.light : styles.dark} `}
    >
      <div
        className={`${styles.contents} ${isTarget && showTargets && hovered && styles.hover} ${
          isSelected && styles.selected
        } ${isLastMove && showHighlights && styles.lastmove}`}
      >
        {isTarget && showTargets && <div className={hasPiece ? styles.ring : styles.dot} />}
      </div>
    </div>
  );
}

interface PieceProps {
  piece: Chess.Piece;
  setSelectedPiece: (piece: [Chess.Square, Chess.Piece]) => void;
  onDrop: () => void;
  disabled: boolean;
  squareSize: number;
  orientation: Chess.Color;
  square: Chess.Square;
  animationSpeed: number;
  moveable?: boolean;
}
export function Piece({
  piece,
  setSelectedPiece,
  onDrop,
  disabled,
  square,
  squareSize,
  orientation,
  animationSpeed,
  moveable,
}: PieceProps) {
  //Prevent strict mode error from deprecated findDomNode
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  //Calculate coordinates from square & orientation
  const coordinates = useMemo<[number, number]>(() => {
    const [x, y] = Chess.squareToCoordinates(square);
    return orientation === "w" ? [x, y * -1] : [7 - x, (7 - y) * -1];
  }, [square, orientation]);
  //Controlled position for draggable; only set on start, drop, or square/coordinates change
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: coordinates[0], y: coordinates[1] });

  //Callback to reset the position to the current coordinates
  // const resetPosition = useCallback(() => {
  //   setPosition({ x: coordinates[0] * squareSize, y: coordinates[1] * squareSize });
  // }, [coordinates, squareSize]);

  useEffect(() => {
    setDragging(true);
    const [x, y] = Chess.squareToCoordinates(square);
    const coords = orientation === "w" ? [x, y * -1] : [7 - x, (7 - y) * -1];
    setPosition({ x: coords[0] * squareSize, y: coords[1] * squareSize });
    setTimeout(() => {
      setDragging(false);
    }, animationSpeed * 1000);
  }, [orientation, squareSize]);

  useEffect(() => {
    if (square && !dragging) {
      const [x, y] = Chess.squareToCoordinates(square);
      const coords = orientation === "w" ? [x, y * -1] : [7 - x, (7 - y) * -1];
      setPosition({ x: coords[0] * squareSize, y: coords[1] * squareSize });
    }
  }, [square, dragging]);

  return (
    <Draggable
      // scale={1}
      // grid={[1, 1]}
      nodeRef={nodeRef}
      allowAnyClick={false}
      bounds="parent"
      position={position}
      onStop={(e, data) => {
        setPosition({ x: data.x, y: data.y });
        onDrop();
        setDragging(false);
      }}
    >
      <div
        onPointerDown={(e) => {
          if (disabled) return;
          if (e.button === 2) return;
          setDragging(true);
          setSelectedPiece([square, piece]);
          const pointer = [e.clientX, e.clientY];
          const piecePos = [nodeRef?.current?.getBoundingClientRect().x, nodeRef?.current?.getBoundingClientRect().y];
          //Snap to cursor
          setPosition((position) => ({
            x: position.x + pointer[0] - ((piecePos[0] || 0) + squareSize / 2),
            y: position.y + pointer[1] - ((piecePos[1] || 0) + squareSize / 2),
          }));
        }}
        style={{
          transition: dragging ? "" : `all ${animationSpeed}s`,
          cursor: dragging ? "grabbing" : "grab",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: squareSize,
          height: squareSize,
          pointerEvents: disabled ? "none" : "auto",
          position: "absolute",
          bottom: 0,
          left: 0,
          transform: `translate(${coordinates[0] * squareSize}px, ${coordinates[1]}px)`,
          zIndex: dragging ? 100 : 10,
        }}
        ref={nodeRef}
      >
        <Image
          src={`/assets/${piece.color}${piece.type}.png`}
          alt={`${piece.color}${piece.type}`}
          height={squareSize * 0.9}
          className={styles.piece}
          width={squareSize * 0.9}
          style={{
            pointerEvents: "none",
          }}
        />
      </div>
    </Draggable>
  );
}

function PromotionMenu() {}

interface StaticPieceProps {
  piece: Chess.Piece;
  square: Chess.Square;
  orientation: Chess.Color;
  squareSize: number;
}

function StaticPiece({ piece, square, orientation, squareSize }: StaticPieceProps) {
  const previousSquare = useRef(square);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [x, y] = Chess.squareToCoordinates(square);
    const coords = orientation === "w" ? [x, y * -1] : [7 - x, (7 - y) * -1];
    const position = { x: coords[0] * squareSize, y: coords[1] * squareSize };
    if (square !== previousSquare.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!ref.current) return;
          ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
        });
      });
      previousSquare.current = square;
    } else {
      if (!ref.current) return;
      ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [square, orientation, squareSize]);

  return (
    <div
      style={{
        transition: `all 0.3s`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: squareSize,
        height: squareSize,
        pointerEvents: "none",
        position: "absolute",
        bottom: 0,
        left: 0,
        zIndex: 10,
      }}
      ref={ref}
    >
      <Image
        src={`/assets/${piece.color}${piece.type}.png`}
        alt={`${piece.color}${piece.type}`}
        height={squareSize * 0.9}
        className={styles.piece}
        width={squareSize * 0.9}
        style={{
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
