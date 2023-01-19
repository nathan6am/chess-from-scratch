import React, { useState, useEffect, useRef, useMemo } from "react";
import _ from "lodash";
import Draggable from "react-draggable";
import * as Chess from "@/lib/chess";
import Image from "next/image";
import styles from "@/styles/Board.module.scss";

interface PieceProps {
  piece: Chess.Piece;
  setSelectedPiece: (piece: [Chess.Square, Chess.Piece]) => void;
  onDrop: () => void;
  disabled: boolean;
  squareSize: number;
  orientation: Chess.Color;
  square: Chess.Square;
  animationSpeed: number;
}

export default function Piece({
  piece,
  setSelectedPiece,
  onDrop,
  disabled,
  square,
  squareSize,
  orientation,
  animationSpeed,
}: PieceProps) {
  //Prevent deprecated findDomNode warning
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const previousSquare = useRef<Chess.Square>(square);
  const [dragging, setDragging] = useState(false);

  //Calculate coordinates from square & orientation
  const coordinates = useMemo<[number, number]>(() => {
    const [x, y] = Chess.squareToCoordinates(square);
    return orientation === "w" ? [x, y * -1] : [7 - x, (7 - y) * -1];
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
          setPosition({
            x: coordinates[0] * squareSize,
            y: coordinates[1] * squareSize,
          });
        });
      });
      //update the previous square
      previousSquare.current = square;
    } else {
      //if the position has changed, but not the square, update the position without animation
      const positionNew = {
        x: coordinates[0] * squareSize,
        y: coordinates[1] * squareSize,
      };
      if (!_.isEqual(position, positionNew)) {
        setDragging(true);
        setPosition(positionNew);
        setTimeout(() => {
          setDragging(false);
        }, animationSpeed * 1000);
      }
    }
  }, [square, dragging, orientation, squareSize, coordinates, animationSpeed]);

  return (
    <Draggable
      nodeRef={nodeRef}
      allowAnyClick={false}
      bounds="parent"
      defaultPosition={position}
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
          const piecePos = [
            nodeRef?.current?.getBoundingClientRect().x,
            nodeRef?.current?.getBoundingClientRect().y,
          ];
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
          //transform: `translate(${coordinates[0] * squareSize}px, ${coordinates[1]}px)`,
          zIndex: dragging ? 100 : 10,
        }}
        ref={nodeRef}
      >
        <Image
          src={`/assets/pieces/standard/${piece.color}${piece.type}.png`}
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
