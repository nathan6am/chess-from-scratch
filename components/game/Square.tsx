import styles from "@/styles/Board.module.scss";
import React, { useMemo } from "react";
import * as Chess from "@/lib/chess";
import classnames from "classnames";
interface SquareProps {
  annotation?: number | string;
  id: string;
  squareSize: number;
  piece: Chess.Piece | null;
  isTarget: boolean;
  setSelectedPiece: (piece: [Chess.Square, Chess.Piece] | null) => void;
  isSelected: boolean;
  square: Chess.Square;
  isLastMove: boolean;
  isPremoved: boolean;
  color: Chess.Color;
  activeColor: Chess.Color;
  onSelectTarget: any;
  hovered: boolean;
  showTargets: boolean;
  showHighlights: boolean;
  clearSelection: () => void;
  orientation: Chess.Color;
  showCoordinates: "hidden" | "inside" | "outside";
}

export default function Square({
  id,
  squareSize,
  showCoordinates,
  isTarget,
  isSelected,
  square,
  isLastMove,
  isPremoved,
  activeColor,
  piece,
  color,
  onSelectTarget,
  hovered,
  showTargets,
  showHighlights,
  setSelectedPiece,
  clearSelection,
  orientation,
  annotation,
}: SquareProps) {
  const coordinates = useMemo(() => Chess.squareToCoordinates(square), [square]);
  const showRank = useMemo(
    () =>
      (orientation === "w" ? coordinates[0] === 0 : coordinates[0] === 7) &&
      showCoordinates !== "hidden",
    [orientation, coordinates, showCoordinates]
  );
  const showFile = useMemo(
    () =>
      (orientation === "w" ? coordinates[1] === 0 : coordinates[1] === 7) &&
      showCoordinates !== "hidden",
    [orientation, coordinates, showCoordinates]
  );
  const [file, rank] = square.split("");
  const textSize = useMemo(() => {
    if (squareSize < 60) return "text-xs";
    else if (squareSize < 85) return "text-sm";
    else return "text-md";
  }, [squareSize]);

  const insideClasses = {
    rank: `absolute top-[1px] md:top-[2px] xl:top-[3px] left-[2px] md:left-[3px] xl:left-[4px] ${
      color === "w" ? "on-light" : "on-dark"
    } opacity-80`,
    file: `absolute bottom-[1px] md:bottom-[2px] xl:bottom-[3px] right-[2px] md:right-[3px] xl:right-[4px] ${
      color === "w" ? "on-light" : "on-dark"
    } opacity-80`,
  };
  const outsideClasses = {
    rank: ` absolute left-[-1em] top-[calc(50%-0.5em)]  opacity-80`,
    file: ` absolute bottom-[-1.5em] left-[calc(50%-0.5em)]  opacity-80`,
  };
  return (
    <div
      id={id}
      onClick={() => {
        if (isTarget) onSelectTarget();
        else clearSelection();
      }}
      className={`${styles.square} ${
        color === "w" ? "square-light" : "square-dark"
      } cursor-pointer`}
    >
      {showRank && (
        <span
          className={`${
            showCoordinates === "inside" ? insideClasses.rank : outsideClasses.rank
          } ${textSize}`}
        >
          {rank}
        </span>
      )}
      {showFile && (
        <span
          className={`${
            showCoordinates === "inside" ? insideClasses.file : outsideClasses.file
          } ${textSize}`}
        >
          {file}
        </span>
      )}
      {annotation && <Annotation squareSize={squareSize} code={annotation} />}
      <div
        className={`${styles.contents} ${isSelected && styles.selected} ${
          isLastMove && showHighlights && styles.lastmove
        }`}
      >
        {isTarget && showTargets && <div className={piece ? styles.ring : styles.dot} />}
      </div>
      <div
        className={`${styles.contents} ${
          isTarget && showTargets && hovered && styles.targetHover
        } opacity-80`}
      ></div>
    </div>
  );
}

function Annotation({ code, squareSize }: { code: number | string; squareSize: number }) {
  const size = useMemo(() => {
    if (squareSize < 80) return "sm";
    return "lg";
  }, [squareSize]);
  const dictionary = [
    {
      code: 1,
      description: "Good Move",
      unicode: "\u0021",
      className: "bg-green-500",
    },
    {
      code: 2,
      description: "Mistake",
      unicode: "\u003F",
      className: "bg-amber-500",
    },
    {
      code: 3,
      description: "Brilliant Move",
      unicode: "\u203C",
      className: "bg-teal-500",
    },
    {
      code: 4,
      description: "Blunder",
      unicode: "\u2047",
      className: "bg-red-500",
    },
    {
      code: 5,
      description: "Interesting Move",
      unicode: "\u2049",
      className: "bg-purple-500",
    },
    {
      code: 6,
      description: "Dubious Move",
      unicode: "\u2048",
      className: "bg-fuchsia-500",
    },
    {
      code: "puzzle-failed",
      description: "Dubious Move",
      unicode: "\u2716",
      className: "bg-red-500",
    },
    {
      code: "puzzle-solved",
      description: "Dubious Move",
      unicode: "\u2713",
      className: "bg-green-600",
    },
  ];
  const details = useMemo(() => {
    return dictionary.find((option) => option.code === code);
  }, [code]);
  if (!details) return null;
  else {
    return (
      <span
        className={classnames(
          "absolute rounded-full shadow-md z-20 flex items-center justify-center",
          details.className,
          {
            "h-[24px] w-[24px] top-[-8px] right-[-8px]": size === "sm",
            "h-[32px] w-[32px] top-[-12px] right-[-12px]": size === "lg",
          }
        )}
      >
        <div
          className={classnames("font-semibold text-center ", {
            "text-xl mb-[1px] ": size === "sm",
            "text-2xl mb-[2px]": size === "lg",
          })}
        >
          {details.unicode}
        </div>
      </span>
    );
  }
}
