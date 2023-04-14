import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import _ from "lodash";
import {
  DraggableCore,
  DraggableData,
  DraggableEvent,
  DraggableEventHandler,
} from "react-draggable";
import * as Chess from "@/lib/chess";
import Image from "next/image";
import styles from "@/styles/Board.module.scss";
const throttle = (f: any) => {
  let token: any = null,
    lastArgs: any = null;
  const invoke = () => {
    f(...lastArgs);
    token = null;
  };
  const result = (...args: any[]) => {
    lastArgs = args;
    if (!token) {
      token = requestAnimationFrame(invoke);
    }
  };
  result.cancel = () => token && cancelAnimationFrame(token);
  return result;
};
interface PieceProps {
  hidden?: boolean;
  disableTransition?: boolean;
  boardRef: React.RefObject<HTMLDivElement>;
  piece: Chess.Piece;
  selectedPiece: [Chess.Square, Chess.Piece] | null;
  setSelectedPiece: (piece: [Chess.Square, Chess.Piece] | null) => void;
  onDrop: () => void;
  disabled: boolean;
  movementType: "click" | "drag" | "both";
  squareSize: number;
  orientation: Chess.Color;
  square: Chess.Square;
  animationSpeed: number;
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
}: PieceProps) {
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
    x: coordinates[0],
    y: coordinates[1],
  });

  useEffect(() => {
    if (dragging) return;
    if (square !== previousSquare.current) {
      //Update the position with transition animation if the square is not the previous square
      //Double RAF is necessary to prevent animation from skipping in some browsers
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (nodeRef.current) {
            nodeRef.current.style.transform = `translate(${coordinates[0] * 100}%, ${
              coordinates[1] * 100
            }%)`;
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
      console.log("here");
      const positionNew = {
        x: coordinates[0] * 100,
        y: coordinates[1] * 100,
      };
      if (position.x !== positionNew.x || position.y !== positionNew.y) {
        if (nodeRef.current) {
          nodeRef.current.style.transform = `translate(${coordinates[0] * 100}%, ${
            coordinates[1] * 100
          }%)`;
        }
        setPosition(positionNew);
      }
    }
  }, [square, dragging, orientation, coordinates, nodeRef, position]);

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
      const x = data.x > 0 ? (data.x > max ? max : data.x) : 0;
      const y = data.y > 0 ? (data.y > max ? max : data.y) : 0;
      if (nodeRef.current)
        nodeRef.current.style.transform = `translate(${x - squareSize / 2}px, ${
          y - squareSize / 2
        }px)`;
    }, 16),
    [boardSize, squareSize]
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
    <DraggableCore
      disabled={!draggable}
      nodeRef={nodeRef}
      allowAnyClick={false}
      offsetParent={boardRef.current || undefined}
      onStart={onStart}
      onDrag={onDrag}
      onStop={onStop}
    >
      {/* // <Draggable
    //   disabled={!draggable}
    //   nodeRef={nodeRef}
    //   allowAnyClick={false}
    //   bounds="parent"
    //   //position={position}
    //   onStop={(e, data) => {
    //     setPosition({ x: data.x, y: data.y });
    //     setDragging(false);
    //   }}
    // > */}
      <div
        onPointerDown={(e) => {
          if (disabled) return;
          if (e.button === 2) return;
          if (draggable) {
            setDragging(true);
            setSelectedPiece([square, piece]);
            const pointer = [e.clientX, e.clientY];
            const piecePos = [
              nodeRef?.current?.getBoundingClientRect().x,
              nodeRef?.current?.getBoundingClientRect().y,
            ];
            //Snap to cursor
            // setPosition((position) => {
            //   console.log(position.x);
            //   const offsetX = (((pointer[0] - (piecePos[0] || 0)) * 8) / squareSize) * 100 + 50;
            //   const test = {
            //     x: position.x + pointer[0] - ((piecePos[0] || 0) + squareSize / 2),
            //     y: position.y + pointer[1] - ((piecePos[1] || 0) + squareSize / 2),
            //   };
            //   console.log(test);
            //   return {
            //     x: position.x + pointer[0] - ((piecePos[0] || 0) + squareSize / 2),
            //     y: position.y + pointer[1] - ((piecePos[1] || 0) + squareSize / 2),
            //   };
            // });
          } else {
            setSelectedPiece([square, piece]);
          }
        }}
        onPointerUp={() => {
          onDrop();
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
          transition: dragging || disableTransition ? "" : `all ${animationSpeed}s`,
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
          zIndex: dragging ? 40 : 10,
          willChange: "transform",
        }}
        ref={nodeRef}
      >
        <div
          className={`${styles.piece} ${piece.color}${piece.type} bg-cover`}
          style={{
            pointerEvents: "none",
            width: `90%`,
            height: `90%`,
          }}
        />
      </div>
    </DraggableCore>
  );
}
