import React, { useCallback, useState, useEffect, useContext, useMemo, useRef, useLayoutEffect, use } from "react";
import Square from "./Square";
import { mergeRefs } from "@/util/misc";
import styles from "@/styles/Board.module.scss";
import * as Chess from "@/lib/chess";
import { AnimSpeedEnum } from "@/context/settings";
import { useResizeDetector } from "react-resize-detector";
import _ from "lodash";
import Piece from "./Piece";
import useBoardTheme from "@/hooks/useBoardTheme";
import usePieceSet from "@/hooks/usePieceSet";
import PromotionMenu from "./PromotionMenu";
import BoardArrows from "../analysis/BoardArrows";
import useBoardArrows from "@/hooks/useBoardArrows";
import useCurrentSquare from "@/hooks/useCurrentSquare";
interface Props {
  showCoordinates: "hidden" | "inside" | "outside";
  theme: string;
  orientation: Chess.Color;
  pieces: Chess.Board;
  legalMoves: Array<Chess.Move>;
  lastMove: Chess.Move | undefined | null;
  activeColor: Chess.Color;
  moveable: Chess.Color | "both" | "none";
  preMoveable: boolean;
  animationSpeed: "slow" | "fast" | "normal" | "disabled";
  movementType: "click" | "drag" | "both";
  showTargets: boolean;
  showHighlights: boolean;
  autoQueen: boolean;
  onMove: (move: Chess.Move) => void;
  onPremove: (start: Chess.Square, end: Chess.Square) => void;
  premoveQueue?: Array<{ start: Chess.Square; end: Chess.Square }>;
  pieceSet: string;
  lastMoveAnnotation?: number | string;
}

const Board = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      showCoordinates,
      theme,
      orientation,
      pieces,
      legalMoves,
      lastMove,
      activeColor,
      moveable,
      preMoveable,
      autoQueen,
      movementType,
      animationSpeed,
      showTargets,
      showHighlights,
      onMove,
      onPremove,
      pieceSet,
      lastMoveAnnotation,
    }: Props,
    ref
  ) => {
    const boardRef = useRef<HTMLDivElement>(null);

    //Load board/pieces css
    useBoardTheme(theme);
    usePieceSet(pieceSet);

    // Track the current square of the pointer
    const currentSquare = useCurrentSquare(orientation, boardRef);

    //TODO: Clear selected piece when clicking outside the board
    const [selectedPiece, setSelectedPiece] = useState<[Chess.Square, Chess.Piece] | null>(null);

    //Show Promotion Menu
    const [promotionMove, setPromotionMove] = useState<{
      start: Chess.Square;
      end: Chess.Square;
    } | null>(null);

    useEffect(() => {
      setPromotionMove(null);
    }, [lastMove]);
    /* Callback to execute when a selected piece is dropped on a square; 
  if the drop square is a valid move, it calls the passed `onMove` prop, passing it the 
  selected piece and the target square */
    const onDrop = useCallback(() => {
      if (!currentSquare || !selectedPiece) {
        //console.log("here");
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

    const arrowManager = useBoardArrows(currentSquare);
    const lastMoveRef = useRef(lastMove);
    useEffect(() => {
      if (_.isEqual(lastMove, lastMoveRef.current)) {
        return;
      } else {
        lastMoveRef.current = lastMove;
        arrowManager.clear();
      }
    }, [lastMove, lastMoveRef, arrowManager]);
    return (
      <>
        <BoardArrows arrows={arrowManager.arrows} pendingArrow={arrowManager.pendingArrow}>
          <div
            className={`${styles.board} relative mx-0 ${showCoordinates === "outside" ? "m-2" : ""} board-bg`}
            ref={mergeRefs([ref, boardRef])}
            onContextMenu={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <PromotionMenu
              cancel={() => setPromotionMove(null)}
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
              row.map((square) => {
                const piece = pieces.find((piece) => piece[0] === square);
                return (
                  <Square
                    markedColor={arrowManager.markedSquares.find((marked) => marked.square === square)?.color}
                    showCoordinates={showCoordinates}
                    activeColor={activeColor}
                    id={square}
                    key={square}
                    piece={piece ? piece[1] : null}
                    isTarget={(selectedPiece && selectedPiece[1].targets?.includes(square)) || false}
                    isSelected={(selectedPiece && selectedPiece[0] === square) || false}
                    square={square}
                    color={Chess.getSquareColor(square)}
                    onSelectTarget={() => {
                      onSelectTarget(square);
                    }}
                    setSelectedPiece={setSelectedPiece}
                    isPremoved={false}
                    showTargets={showTargets}
                    showHighlights={showHighlights}
                    clearSelection={() => {
                      clearSelection();
                      arrowManager.clear();
                    }}
                    squareSize={squareSize}
                    hovered={currentSquare === square}
                    isLastMove={lastMove?.start === square || lastMove?.end === square}
                    annotation={(lastMove?.end === square && lastMoveAnnotation) || undefined}
                    orientation={orientation}
                  />
                );
              })
            )}
            {pieces.map(([square, piece]) => (
              <Piece
                selectedPiece={selectedPiece}
                animationSpeed={AnimSpeedEnum[animationSpeed]}
                setSelectedPiece={setSelectedPiece}
                key={`${piece.key}${orientation}`}
                piece={piece}
                square={square}
                movementType={movementType}
                disabled={
                  (moveable !== "both" && piece.color !== moveable) || (!preMoveable && piece.color !== activeColor)
                }
                orientation={orientation}
                onDrop={onDrop}
                squareSize={squareSize}
              />
            ))}
          </div>
        </BoardArrows>
      </>
    );
  }
);

Board.displayName = "Board";
export default Board;
