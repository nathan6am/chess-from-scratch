import React, {
  useCallback,
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
} from "react";
import Square from "./Square";
import { mergeRefs } from "@/util/misc";
import styles from "@/styles/Board.module.scss";
import * as Chess from "@/lib/chess";
import { AnimSpeedEnum } from "@/context/settings";
import { useResizeDetector } from "react-resize-detector";
import _ from "lodash";
import Piece from "./Piece";
import EditModePiece, { PieceHandle } from "./EditModePiece";
import useBoardTheme from "@/hooks/useBoardTheme";
import usePieceSet from "@/hooks/usePieceSet";
import PromotionMenu from "./PromotionMenu";
import BoardArrows from "../analysis/BoardArrows";
import useBoardMarkup from "@/hooks/useBoardMarkup";
import { Arrow, ArrowColor, MarkedSquare } from "@/lib/types";
import { useArrowState } from "@/hooks/useBoardMarkup";
import useCurrentSquare from "@/hooks/useCurrentSquare";
interface Props {
  editMode?: boolean;
  squareIdPrefix?: string;
  keyPrefix?: string;
  hidePieces?: boolean;
  overrideTheme?: boolean;
  disableTransitions?: boolean;
  showCoordinates: "hidden" | "inside" | "outside"; //Where or if to display the rank and file indictors
  theme: string; //Board theme
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
  onMove: (move: Chess.Move) => void; //Callback to execute when a move it attempted
  onPremove: (start: Chess.Square, end: Chess.Square) => void;
  premoveQueue?: Array<{ start: Chess.Square; end: Chess.Square }>;
  pieceSet: string; //Piece theme
  lastMoveAnnotation?: number | string; //Annotation to show on the board for the last move
  showAnnotation?: boolean; //Whether or not to show annotations on board
  arrows?: Arrow[];
  markedSquares?: MarkedSquare[];
  onArrow?: (arrow: Arrow) => void;
  onMarkSquare?: (markedSquare: MarkedSquare) => void;
  onClear?: () => void;
  markupColor?: ArrowColor;
  overrideArrows?: boolean;
  disableArrows?: boolean;
  editModeEnabled?: boolean;
  onAddPiece?: (square: Chess.Square, piece: Chess.Piece) => void;
  onRemovePiece?: (square: Chess.Square) => void;
  onMovePiece?: (start: Chess.Square, end: Chess.Square) => void;
}

export interface BoardHandle extends HTMLDivElement {
  // Add any additional methods that you want to expose

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
            className={`${styles.board} relative mx-0 ${showCoordinates === "outside" ? "m-2" : ""} board-bg`}
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
                    isTarget={(selectedPiece && selectedPiece[1].targets?.includes(square)) || false}
                    isSelected={(!editMode && selectedPiece && selectedPiece[0] === square) || false}
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
                  !editMode &&
                  ((moveable !== "both" && piece.color !== moveable) || (!preMoveable && piece.color !== activeColor))
                }
                orientation={orientation}
                onDrop={onDrop}
                squareSize={squareSize}
                constrainToBoard={false}
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
