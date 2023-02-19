import React, { useCallback, useState, useEffect, useContext, useMemo, useRef, useLayoutEffect } from "react";
import { SettingsContext } from "@/context/settings";
import { mergeRefs } from "@/util/misc";
import styles from "@/styles/Board.module.scss";
import * as Chess from "@/lib/chess";
import { AnimSpeedEnum } from "@/context/settings";
import usePointerCoordinates from "@/hooks/usePointerCoordinates";
import { useResizeDetector } from "react-resize-detector";
import Draggable from "react-draggable";
import Image from "next/image";
import _ from "lodash";
import Piece from "./Piece";
import { position } from "html2canvas/dist/types/css/property-descriptors/position";
interface Props {
  orientation: Chess.Color;
  pieces: Chess.Board;
  legalMoves: Array<Chess.Move>;
  lastMove: Chess.Move | undefined | null;
  activeColor: Chess.Color;
  moveable: Chess.Color | "both" | "none";
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
function useCurrentSquare(orientation: Chess.Color, boardRef: React.RefObject<HTMLDivElement>): Chess.Square | null {
  const [currentSquare, setCurrentSquare] = useState<Chess.Square | null>(null);
  const { x, y } = usePointerCoordinates(8, boardRef);
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

  return currentSquare;
}

const Board = React.forwardRef<HTMLDivElement, Props>(
  (
    {
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
    }: Props,
    ref
  ) => {
    const boardRef = useRef<HTMLDivElement>(null);
    // Track the current square of the pointer
    const currentSquare = useCurrentSquare(orientation, boardRef);

    //TODO: Clear selected piece when clicking outside the board
    const [selectedPiece, setSelectedPiece] = useState<[Chess.Square, Chess.Piece] | null>(null);

    //Show Promotion Menu
    const [promotionMove, setPromotionMove] = useState<{ start: Chess.Square; end: Chess.Square } | null>(null);

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
          const move = legalMoves.find(
            (move) => move.start === square && move.end === currentSquare && move.promotion === "q"
          );
          if (move) onMove(move);
        } else if (move.promotion) {
          setPromotionMove({
            start: move.start,
            end: move.end,
          });
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
            setPromotionMove({
              start: move.start,
              end: move.end,
            });
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
    const { width } = useResizeDetector<HTMLDivElement>({ targetRef: boardRef });
    const squareSize = (width || 0) / 8;

    return (
      <>
        <div className={`${styles.board} relative mx-0`} ref={mergeRefs([ref, boardRef])}>
          <PromotionMenu
            orientation={orientation}
            promotionMove={promotionMove}
            activeColor={activeColor}
            onSelect={(type) => {
              if (!promotionMove) return;
              const move = legalMoves.find(
                (move) =>
                  move.start === promotionMove.start && move.end === promotionMove.end && move.promotion === type
              );
              if (move) {
                setPromotionMove(null);
                onMove(move);
              } else {
                setPromotionMove(null);
              }
            }}
          />
          {boardMap.map((row) =>
            row.map((square) => (
              <RenderSquare
                key={square}
                hasPiece={pieces.some((piece) => piece[0] === square)}
                isTarget={(selectedPiece && selectedPiece[1].targets?.includes(square)) || false}
                isSelected={(selectedPiece && selectedPiece[0] === square) || false}
                square={square}
                color={Chess.getSquareColor(square)}
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
          {pieces.map(([square, piece]) => (
            <Piece
              animationSpeed={AnimSpeedEnum[animationSpeed]}
              setSelectedPiece={setSelectedPiece}
              key={`${piece.key}${orientation}`}
              piece={piece}
              square={square}
              disabled={
                (moveable !== "both" && piece.color !== moveable) || (!preMoveable && piece.color !== activeColor)
              }
              orientation={orientation}
              onDrop={onDrop}
              squareSize={squareSize}
            />
          ))}
        </div>
      </>
    );
  }
);

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
        else clearSelection();
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

interface PromotionProps {
  promotionMove: { start: Chess.Square; end: Chess.Square } | null;
  orientation: Chess.Color;
  activeColor: Chess.Color;
  onSelect: (type: Chess.PieceType) => void;
  cancel?: () => void;
}
function PromotionMenu({ promotionMove, orientation, activeColor, onSelect }: PromotionProps) {
  if (!promotionMove) return <></>;
  const [file] = Chess.squareToCoordinates(promotionMove.end);
  const col = orientation === "w" ? 1 + file : 8 - file;
  const rowMult = orientation === activeColor ? 1 : -1;
  return (
    <>
      {promotionMove && (
        <div
          className={`${styles.promotionMenu} absolute top-0 bottom-0 left-0 right-0 bg-black/[0.5]`}
          style={{ zIndex: 300 }}
        >
          <PromotionRow
            position={col}
            pieceType="q"
            color={activeColor}
            row={1 * rowMult}
            col={col}
            onSelect={onSelect}
          />
          <PromotionRow
            position={col}
            pieceType="r"
            color={activeColor}
            row={2 * rowMult}
            col={col}
            onSelect={onSelect}
          />
          <PromotionRow
            position={col}
            pieceType="b"
            color={activeColor}
            row={3 * rowMult}
            col={col}
            onSelect={onSelect}
          />
          <PromotionRow
            position={col}
            pieceType="n"
            color={activeColor}
            row={4 * rowMult}
            col={col}
            onSelect={onSelect}
          />
        </div>
      )}
    </>
  );
}
interface PromotionRowProps {
  position: number;
  pieceType: Chess.PieceType;
  color: Chess.Color;
  row: number;
  col: number;
  onSelect: (type: Chess.PieceType) => void;
}
function PromotionRow({ position, pieceType, color, row, onSelect }: PromotionRowProps) {
  return (
    <>
      <div
        onClick={() => {
          onSelect(pieceType);
        }}
        style={{ gridColumnStart: position, gridRowStart: row }}
        className={`${styles.square} box-border border-4 cursor-pointer  border-[#cfcfcf]/[0.8] hover:border-white rounded-full bg-[#505050]/[0.5] backdrop-blur-lg group flex justify-center items-center`}
      >
        <img
          className="group-hover:scale-110 ease-in-out duration-200"
          src={`/assets/pieces/standard/${color}${pieceType}.png`}
          alt={`${color}${pieceType}`}
          height="90%"
          width="90%"
          style={{
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

Board.displayName = "Board";
export default Board;
