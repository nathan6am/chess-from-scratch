import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import _, { invert } from "lodash";
import { DraggableCore, DraggableData, DraggableEvent, DraggableEventHandler } from "react-draggable";
import * as Chess from "@/lib/chess";
import styles from "@/styles/Board.module.scss";

interface PieceProps {
  hidden?: boolean;
  premovedFrom?: Chess.Square;
  disableTransition?: boolean;
  boardRef: React.RefObject<HTMLDivElement>;
  piece: Chess.Piece;
  selectedPiece: [Chess.Square, Chess.Piece] | null;
  setSelectedPiece: (piece: [Chess.Square, Chess.Piece] | null) => void;
  onDrop: (coordinates?: { x: number; y: number }) => void;
  disabled: boolean;
  movementType: "click" | "drag" | "both";
  squareSize: number;
  orientation: Chess.Color;
  square: Chess.Square;
  animationSpeed: number;
  constrainToBoard?: boolean;
  invert?: boolean;
}

export interface PieceHandle extends HTMLDivElement {
  // Add any additional methods that you want to expose
  startDrag: () => void;
}
export default function Piece({
  piece,
  selectedPiece,
  setSelectedPiece,
  onDrop,
  disabled,
  square,
  squareSize,
  orientation,
  movementType,
  animationSpeed,
  boardRef,
  hidden,
  disableTransition,
  premovedFrom,
  constrainToBoard = true,
  invert,
}: PieceProps) {
  const transitionRef = useRef<boolean>(false);
  const selectedRef = useRef<boolean>(false);
  //Prevent deprecated findDomNode warning
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const previousSquare = useRef<Chess.Square>(square);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!_.isEqual(selectedPiece, [square, piece])) {
      selectedRef.current = false;
    }
  }, [selectedPiece]);

  //Calculate coordinates from square & orientation
  const coordinates = useMemo<[number, number]>(() => {
    const [x, y] = Chess.squareToCoordinates(square);
    return orientation === "w" ? [x, 7 - y] : [7 - x, y];
  }, [square, orientation]);
  //Controlled position for draggable; only set on start, drop, or square/coordinates change
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: coordinates[0] * 100,
    y: coordinates[1] * 100,
  });
  //Prevent inital transition animation
  useEffect(() => {
    transitionRef.current = true;
  }, [transitionRef]);
  useEffect(() => {
    if (dragging) return;
    if (square !== previousSquare.current && square !== premovedFrom) {
      //Update the position with transition animation if the square is not the previous square
      //Double RAF is necessary to prevent animation from skipping in some browsers
      transitionRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (nodeRef.current) {
            nodeRef.current.style.transform = `translate(${coordinates[0] * 100}%, ${coordinates[1] * 100}%)`;
          }
          setPosition({
            x: coordinates[0] * 100,
            y: coordinates[1] * 100,
          });
        });
      });
      //update the previous square
      previousSquare.current = square;
    } else {
      const positionNew = {
        x: coordinates[0] * 100,
        y: coordinates[1] * 100,
      };
      if (position.x !== positionNew.x || position.y !== positionNew.y) {
        if (nodeRef.current) {
          nodeRef.current.style.transform = `translate(${coordinates[0] * 100}%, ${coordinates[1] * 100}%)`;
        }
        setPosition(positionNew);
      }
    }
  }, [square, dragging, orientation, coordinates, nodeRef, position, previousSquare]);

  const draggable = movementType === "both" || movementType === "drag";
  const boardSize = useMemo(() => squareSize * 8, [squareSize]);
  const onStart = useCallback<DraggableEventHandler>(
    (e, data) => {
      const percentX = (data.x / squareSize) * 100 - 50;
      const percentY = (data.y / squareSize) * 100 - 50;
      setPosition({ x: percentX, y: percentY });
    },
    [squareSize]
  );
  const onDrag = useCallback(
    _.throttle<DraggableEventHandler>((e: DraggableEvent, data: DraggableData) => {
      const max = boardSize;
      const x = constrainToBoard ? (data.x > 0 ? (data.x > max ? max : data.x) : 0) : data.x;
      const y = constrainToBoard ? (data.y > 0 ? (data.y > max ? max : data.y) : 0) : data.y;
      if (nodeRef.current)
        nodeRef.current.style.transform = `translate(${x - squareSize / 2}px, ${y - squareSize / 2}px)`;
    }, 16),
    [boardSize, squareSize, constrainToBoard]
  );
  const onStop = useCallback<DraggableEventHandler>(
    (e, data) => {
      onDrag.cancel();
      const percentX = (data.x / squareSize) * 100 - 50;
      const percentY = (data.y / squareSize) * 100 - 50;
      setPosition({ x: percentX, y: percentY });
      setDragging(false);
    },
    [squareSize, onDrag]
  );

  return (
    <>
      <DraggableCore
        disabled={!draggable}
        nodeRef={nodeRef}
        allowAnyClick={false}
        offsetParent={boardRef.current || undefined}
        onStart={onStart}
        onDrag={onDrag}
        onStop={onStop}
      >
        <div
          onPointerDown={(e) => {
            if (disabled) return;
            if (e.button === 2) return;
            if (draggable) {
              setDragging(true);
              setSelectedPiece([square, piece]);
            } else {
              setSelectedPiece([square, piece]);
            }
          }}
          onPointerUp={(e) => {
            if (boardRef.current) {
              const pointerOffsetCoords = {
                x: e.clientX - boardRef.current.getBoundingClientRect().left,
                y: e.clientY - boardRef.current.getBoundingClientRect().top,
              };
              console.log(pointerOffsetCoords);
              onDrop(pointerOffsetCoords);
            } else {
              onDrop();
            }
            if (movementType === "drag") {
              setSelectedPiece(null);
            } else {
              if (selectedRef.current) {
                setSelectedPiece(null);
                selectedRef.current = false;
              } else {
                selectedRef.current = true;
              }
            }
          }}
          style={{
            transition:
              dragging || disableTransition || transitionRef.current === false ? "" : `all ${animationSpeed}s`,
            cursor: draggable ? (dragging ? "grabbing" : "grab") : "pointer",
            display: hidden ? "none" : "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "12.5%",
            height: "12.5%",
            pointerEvents: disabled ? "none" : "auto",
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${position.x}%, ${position.y}%)`,
            zIndex: dragging ? 31 : 10,
            willChange: "transform",
          }}
          ref={nodeRef}
        >
          <div
            className={`${styles.piece} ${piece.color}${piece.type} bg-cover ${invert ? "rotate-180" : ""}`}
            style={{
              pointerEvents: "none",
              width: `90%`,
              height: `90%`,
            }}
          />
        </div>
      </DraggableCore>
      {premovedFrom && <GhostPiece piece={piece} square={premovedFrom} orientation={orientation} />}
    </>
  );
}

interface GhostPieceProps {
  piece: Chess.Piece;
  square: Chess.Square;
  orientation: Chess.Color;
}
function GhostPiece({ piece, square, orientation }: GhostPieceProps) {
  //Calculate coordinates from square & orientation
  const coordinates = useMemo<[number, number]>(() => {
    const [x, y] = Chess.squareToCoordinates(square);
    return orientation === "w" ? [x, 7 - y] : [7 - x, y];
  }, [square, orientation]);
  //Controlled position for draggable; only set on start, drop, or square/coordinates change
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: coordinates[0] * 100,
    y: coordinates[1] * 100,
  });
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "12.5%",
        height: "12.5%",
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${position.x}%, ${position.y}%)`,
        zIndex: 10,
      }}
    >
      <div
        className={`${styles.piece} ${piece.color}${piece.type} bg-cover`}
        style={{
          pointerEvents: "none",
          width: `90%`,
          height: `90%`,
          opacity: `25%`,
        }}
      />
    </div>
  );
}
