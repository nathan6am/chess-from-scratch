import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, useCallback } from "react";
import _, { set } from "lodash";
import { DraggableCore, DraggableData, DraggableEvent, DraggableEventHandler } from "react-draggable";
import * as Chess from "@/lib/chess";
import styles from "@/styles/Board.module.scss";
import { on } from "events";
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
  boardRef: React.RefObject<HTMLDivElement>;
  piece: Chess.Piece;
  onDrop: (coordinates?: { x: number; y: number }) => void;
  movementType: "click" | "drag" | "both";
  squareSize: number;
  orientation: Chess.Color;
  animationSpeed: number;
  constrainToBoard?: boolean;
}

export interface PieceHandle {
  // Add any additional methods that you want to expose
  startDrag: (e: React.MouseEvent<HTMLElement>) => void;
}
const EditModePiece = React.forwardRef<PieceHandle, PieceProps>(
  ({ piece, onDrop, squareSize, orientation, boardRef, hidden, constrainToBoard = true }: PieceProps, ref) => {
    const transitionRef = useRef<boolean>(false);
    //Prevent deprecated findDomNode warning
    const nodeRef = React.useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState(false);

    //Calculate coordinates from square & orientation

    //Controlled position for draggable; only set on start, drop, or square/coordinates change

    //Prevent inital transition animation
    useEffect(() => {
      transitionRef.current = true;
    }, [transitionRef]);

    const boardSize = useMemo(() => squareSize * 8, [squareSize]);
    const onStart = useCallback<DraggableEventHandler>((e, data) => {}, [squareSize]);
    const onDrag = useCallback(
      _.throttle<DraggableEventHandler>((e: DraggableEvent, data: DraggableData) => {
        const max = boardSize;
        const x = constrainToBoard ? (data.x > 0 ? (data.x > max ? max : data.x) : 0) : data.x;
        const y = constrainToBoard ? (data.y > 0 ? (data.y > max ? max : data.y) : 0) : data.y;
        setDragging(true);
        if (nodeRef.current)
          nodeRef.current.style.transform = `translate(${x - squareSize / 2}px, ${y - squareSize / 2}px)`;
      }, 16),
      [boardSize, squareSize]
    );
    const onStop = useCallback<DraggableEventHandler>(
      (e, data) => {
        onDrag.cancel();
        setDragging(false);
      },
      [squareSize, onDrag]
    );
    useImperativeHandle(ref, () => ({
      // Example method to focus the child component
      startDrag: (e) => {
        if (!boardRef.current) return;
        const pointerCoordinates = { x: e.clientX, y: e.clientY };
        const pointerOffsetCoords = {
          x: pointerCoordinates.x - boardRef.current.getBoundingClientRect().left,
          y: pointerCoordinates.y - boardRef.current.getBoundingClientRect().top,
        };
        console.log(pointerOffsetCoords);
        //setDragging(true);

        nodeRef.current?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        if (nodeRef.current) {
          nodeRef.current.style.transform = `translate(${pointerOffsetCoords.x - squareSize / 2}px, ${
            pointerOffsetCoords.y - squareSize / 2
          }px)`;
        }
      },
    }));
    return (
      <DraggableCore
        nodeRef={nodeRef}
        allowAnyClick={false}
        offsetParent={boardRef.current || undefined}
        onStart={onStart}
        onDrag={onDrag}
        onStop={onStop}
      >
        <div
          onPointerDown={(e) => {
            if (e.button === 2) return;
            setDragging(true);
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
          }}
          style={{
            transition: "none",
            cursor: dragging ? "grabbing" : "grab",
            display: dragging ? "flex" : "none",
            justifyContent: "center",
            alignItems: "center",
            width: "12.5%",
            height: "12.5%",
            pointerEvents: "auto",
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${0}%, ${0}%)`,
            zIndex: dragging ? 31 : 10,
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
);

export default EditModePiece;
