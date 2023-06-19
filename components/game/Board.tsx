import React, { useCallback, useState, useEffect, useRef, useImperativeHandle } from "react";
import styles from "@/styles/Board.module.scss";

//Types
import { Arrow, ArrowColor, MarkedSquare } from "@/lib/types";
import { AnimSpeedEnum } from "@/context/settings";

//Components
import Square from "./Square";
import Piece from "./Piece";
import EditModePiece, { PieceHandle } from "./EditModePiece";
import PromotionMenu from "./PromotionMenu";
import BoardArrows from "../analysis/BoardArrows";

//Hooks;
import { useArrowState } from "@/hooks/useBoardMarkup";
import useCurrentSquare from "@/hooks/useCurrentSquare";
import useBoardMarkup from "@/hooks/useBoardMarkup";
import useBoardTheme from "@/hooks/useBoardTheme";
import usePieceSet from "@/hooks/usePieceSet";
import { useResizeDetector } from "react-resize-detector";

//Util
import { mergeRefs } from "@/util/misc";
import * as Chess from "@/lib/chess";
import _ from "lodash";

interface Props {
  editMode?: boolean; //Whether or not to enable edit mode
  squareIdPrefix?: string; //Prefix to add to the square id
  keyPrefix?: string; //Prefix to add to the key (rerender on change)
  hidePieces?: boolean; //Whether or not to hide the pieces
  overrideTheme?: boolean; //Whether or not to override the theme
  disableTransitions?: boolean; //Disable piece transitions
  showCoordinates: "hidden" | "inside" | "outside"; //Where or if to display the rank and file indictors
  theme: string; //Board theme
  orientation: Chess.Color; //Board orientation
  pieces: Chess.Board; //Array of pieces to display on the board
  legalMoves: Array<Chess.Move>; //Array of legal moves in the current position
  lastMove: Chess.Move | undefined | null; //Last move made
  activeColor: Chess.Color; //Active color
  moveable: Chess.Color | "both" | "none"; //Color of pieces that can be moved
  preMoveable: boolean; //Whether or not to allow premoves
  animationSpeed: "slow" | "fast" | "normal" | "disabled"; //Speed of piece animations
  movementType: "click" | "drag" | "both"; //Type of movement to allow
  showTargets: boolean; //Whether or not to show the targets for the selected piece
  showHighlights: boolean; //Whether or not to show the highlights for the selected piece, last move, etc.
  autoQueen: boolean; //Whether or not to auto queen on promotion
  onMove: (move: Chess.Move) => void; //Callback to execute when a move it attempted
  onPremove: (start: Chess.Square, end: Chess.Square) => void; //Callback to execute when a premove is queued
  premoveQueue?: Array<{ start: Chess.Square; end: Chess.Square }>; //Array of queued premove moves for display
  pieceSet: string; //Piece theme
  lastMoveAnnotation?: number | string; //Annotation to show on the board for the last move
  showAnnotation?: boolean; //Whether or not to show annotations on board
  arrows?: Arrow[]; //Array of arrows to display on the board
  markedSquares?: MarkedSquare[]; //Array of marked squares to display on the board
  onArrow?: (arrow: Arrow) => void; //Callback to execute when an arrow is drawn
  onMarkSquare?: (markedSquare: MarkedSquare) => void; //Callback to execute when a square is marked
  onClear?: () => void; //Callback to execute when the annotations are cleared
  markupColor?: ArrowColor; //Color of the arrows and marked squares
  overrideArrows?: boolean; //Whether or not to override the arrows
  disableArrows?: boolean; //Whether or not to disable arrows
  onAddPiece?: (square: Chess.Square, piece: Chess.Piece) => void; //Callback to execute when a piece is added in edit mode
  onRemovePiece?: (square: Chess.Square) => void; //Callback to execute when a piece is removed in edit mode
  onMovePiece?: (start: Chess.Square, end: Chess.Square) => void; //Callback to execute when a piece is moved in edit mode
  pieceCursor?: Chess.Piece | "remove" | null; //Piece to draw when a square is clicked in edit mode
}

//Expose methods to parent components
export interface BoardHandle extends HTMLDivElement {
  spawnDraggablePiece: (piece: Chess.Piece, e: React.MouseEvent<HTMLElement>) => void;
}
const Board = React.forwardRef<BoardHandle, Props>(
  (
    {
      disableTransitions,
      overrideTheme,
      squareIdPrefix,
      hidePieces,
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
      arrows,
      onArrow,
      onClear,
      onMarkSquare,
      markedSquares,
      markupColor = "G",
      overrideArrows,
      disableArrows,
      keyPrefix = "",
      onAddPiece,
      onRemovePiece,
      onMovePiece,
      editMode,
      pieceCursor,
    }: Props,
    ref
  ) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const editPieceRef = useRef<PieceHandle>(null);

    //Load board/pieces css
    useBoardTheme(theme, overrideTheme);
    usePieceSet(pieceSet, overrideTheme);

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
      if (editMode && selectedPiece && !currentSquare && onRemovePiece) {
        onRemovePiece(selectedPiece[0]);
        setSelectedPiece(null);
        return;
      }
      if (!currentSquare || !selectedPiece) {
        //console.log("here");
        return;
      } else {
        const [square, piece] = selectedPiece;
        //If in edit mode, move the piece to the new square
        if (editMode) {
          console.log("here");
          if (onMovePiece) {
            onMovePiece(square, currentSquare);
          }
          setSelectedPiece(null);
          return;
        }
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
    }, [
      currentSquare,
      selectedPiece,
      autoQueen,
      legalMoves,
      activeColor,
      moveable,
      onMove,
      preMoveable,
      onPremove,
      editMode,
    ]);

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
          const move = legalMoves.find(
            (move) => move.start === square && move.end === targetSquare
          );
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
    const localArrows = useArrowState();
    const { currentArrow, onMouseDown, onMouseUp, onContextMenu } = useBoardMarkup({
      disabled: disableArrows,
      color: markupColor,
      currentSquare,
      onArrow: onArrow && overrideArrows ? onArrow : localArrows.onArrow,
      onMarkSquare: onMarkSquare && overrideArrows ? onMarkSquare : localArrows.onMarkSquare,
    });
    const lastMoveRef = useRef<Chess.Move | null | undefined>(lastMove);
    useEffect(() => {
      if (lastMoveRef.current === lastMove) return;
      lastMoveRef.current = lastMove;
      localArrows.clear();
    }, [lastMove, localArrows, lastMoveRef]);
    const [draggablePiece, setDraggablePiece] = useState<Chess.Piece | null>(null);
    const exposedMethods = {
      spawnDraggablePiece: (piece: Chess.Piece, e: React.MouseEvent<HTMLElement>) => {
        setDraggablePiece(piece);
        editPieceRef.current?.startDrag(e);
      },

      ...boardRef.current,
    } as BoardHandle;
    useImperativeHandle(ref, () => exposedMethods, [exposedMethods]);
    return (
      <>
        <BoardArrows
          squareSize={squareSize}
          squareIdPrefix={squareIdPrefix}
          arrows={arrows || (overrideArrows ? [] : localArrows.arrows)}
          pendingArrow={currentArrow}
        >
          <div
            className={`${styles.board} relative mx-0 ${
              showCoordinates === "outside" ? "m-2" : ""
            } board-bg`}
            ref={mergeRefs([ref, boardRef])}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
                    move.start === promotionMove.start &&
                    move.end === promotionMove.end &&
                    move.promotion === type
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
                const markedColor = markedSquares
                  ? markedSquares.find((marked) => marked.square === square)?.color
                  : overrideArrows
                  ? undefined
                  : localArrows.markedSquares.find((marked) => marked.square === square)?.color;
                return (
                  <Square
                    markedColor={markedColor}
                    showCoordinates={showCoordinates}
                    activeColor={activeColor}
                    id={`${squareIdPrefix || ""}${square}`}
                    key={square}
                    piece={piece ? piece[1] : null}
                    isTarget={
                      (selectedPiece && selectedPiece[1].targets?.includes(square)) || false
                    }
                    isSelected={
                      (!editMode && selectedPiece && selectedPiece[0] === square) || false
                    }
                    square={square}
                    color={Chess.getSquareColor(square)}
                    onSelectTarget={() => {
                      onSelectTarget(square);
                    }}
                    onClick={() => {
                      if (editMode && pieceCursor && onAddPiece && onRemovePiece) {
                        if (pieceCursor === "remove") {
                          onRemovePiece(square);
                          return;
                        }
                        if (
                          pieces.some(([exsquare, expiece]) => {
                            return (
                              exsquare === square &&
                              expiece.type === pieceCursor.type &&
                              expiece.color === pieceCursor.color
                            );
                          })
                        ) {
                          onRemovePiece(square);
                          return;
                        } else onAddPiece(square, pieceCursor);
                      }
                    }}
                    setSelectedPiece={setSelectedPiece}
                    isPremoved={false}
                    showTargets={showTargets}
                    showHighlights={showHighlights}
                    clearSelection={() => {
                      clearSelection();
                      if (onClear) onClear();
                      localArrows.clear();
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
                hidden={hidePieces}
                boardRef={boardRef}
                selectedPiece={selectedPiece}
                animationSpeed={AnimSpeedEnum[animationSpeed]}
                setSelectedPiece={setSelectedPiece}
                key={`${keyPrefix}${piece.key}${orientation}`}
                piece={piece}
                square={square}
                movementType={movementType}
                disabled={
                  editMode
                    ? pieceCursor !== null
                    : (moveable !== "both" && piece.color !== moveable) ||
                      (!preMoveable && piece.color !== activeColor)
                }
                orientation={orientation}
                onDrop={onDrop}
                squareSize={squareSize}
                constrainToBoard={editMode === true ? false : true}
              />
            ))}

            {editMode && (
              <EditModePiece
                ref={editPieceRef}
                hidden={hidePieces}
                boardRef={boardRef}
                animationSpeed={AnimSpeedEnum[animationSpeed]}
                key={`${keyPrefix}${`edit`}${orientation}`}
                piece={draggablePiece || { color: "w", type: "p", key: "edit" }}
                movementType={movementType}
                orientation={orientation}
                onDrop={() => {
                  if (editMode && currentSquare && draggablePiece) {
                    if (onAddPiece) onAddPiece(currentSquare, draggablePiece);
                  }
                }}
                squareSize={squareSize}
                constrainToBoard={false}
              />
            )}
          </div>
        </BoardArrows>
      </>
    );
  }
);

Board.displayName = "Board";
export default Board;
