import React, { useMemo } from "react";
import Xarrow, { Xwrapper } from "react-xarrows";
import { ArrowColor, Arrow } from "@/lib/types";

export const ColorEnum: Record<ArrowColor, string> = {
  G: "#15803d",
  O: "#b45309",
  R: "#b91c1c",
  B: "#0369a1",
  Y: "#eab308",
};

interface Props {
  children?: JSX.Element | JSX.Element[];
  arrows: Arrow[];
  pendingArrow?: Arrow | null;
  squareIdPrefix?: string;
  squareSize: number;
  bestMoveArrow?: Arrow | null;
}

const headShapeArrow1 = {
  svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0 0 z" />,
  offsetForward: 0.005,
};

const cornerShapeArrow1 = {
  svgElem: <path d="M 0 0.01 L 0.5 0.01 L 0.5 1.01 L 0 1.01 z" />,
  offsetForward: 0.005,
};

const tailShapeArrow1 = {
  svgElem: <path d="" />,
};
export default function BoardArrows({
  children,
  arrows,
  pendingArrow,
  squareIdPrefix,
  squareSize,
  bestMoveArrow,
}: Props) {
  const arrowSize = useMemo(() => {
    if (squareSize < 55) return "sm";
    if (squareSize < 70) return "md";
    return "lg";
  }, [squareSize]);
  return (
    <Xwrapper>
      <>
        {arrows.map((arrow) => (
          <RenderArrow size={arrowSize} idPrefix={squareIdPrefix} arrow={arrow} key={`${arrow.start}${arrow.end}`} />
        ))}
      </>
      <>{pendingArrow && <RenderArrow size={arrowSize} idPrefix={squareIdPrefix} arrow={pendingArrow} />}</>
      <>{bestMoveArrow && <RenderArrow size={arrowSize} idPrefix={squareIdPrefix} arrow={bestMoveArrow} />}</>
      <>{children}</>
    </Xwrapper>
  );
}

interface ArrowProps {
  arrow: Arrow;
  idPrefix?: string;
  size?: "sm" | "md" | "lg";
}

const arrowSize = {
  lg: {
    strokeWidth: 18,
    headSize: 2.5,
    tailSize: 1.8,
  },
  md: {
    strokeWidth: 15,
    headSize: 2.8,
    tailSize: 1.5,
  },
  sm: {
    strokeWidth: 10,
    headSize: 3,
    tailSize: 1.2,
  },
};

function RenderArrow({ arrow, idPrefix, size = "lg" }: ArrowProps) {
  const { strokeWidth, headSize, tailSize } = useMemo(() => arrowSize[size], [size]);
  if (arrow.end) {
    return (
      <Xarrow
        SVGcanvasStyle={{ pointerEvents: "none" }}
        arrowTailProps={{ className: "pointer-none" }}
        arrowBodyProps={{ className: "pointer-none" }}
        arrowHeadProps={{ className: "pointer-none" }}
        SVGcanvasProps={{ className: "opacity-60 pointer-none" }}
        start={(idPrefix || "") + arrow.start}
        end={(idPrefix || "") + arrow.end}
        path={"straight"}
        startAnchor="middle"
        endAnchor="middle"
        color={ColorEnum[arrow.color]}
        zIndex={17}
        strokeWidth={strokeWidth}
        headSize={headSize}
        headShape={headShapeArrow1}
        showTail
        tailShape={tailShapeArrow1}
        tailSize={tailSize}
      />
    );
  }
  return <></>;
}

function KnightArrow() {
  return (
    <>
      <Xarrow
        SVGcanvasProps={{ className: "opacity-60 pointer-none" }}
        start={"g1"}
        end={"g3"}
        path={"straight"}
        startAnchor="middle"
        endAnchor="middle"
        color={"#b45309"}
        zIndex={17}
        strokeWidth={18}
        headSize={0.5}
        headShape={tailShapeArrow1}
        showTail
        tailShape={tailShapeArrow1}
        tailSize={1}
      />
      <Xarrow
        SVGcanvasProps={{ className: "opacity-60 pointer-none" }}
        start={"g3"}
        end={"f3"}
        path={"straight"}
        startAnchor="middle"
        endAnchor="middle"
        color={"#b45309"}
        zIndex={17}
        strokeWidth={18}
        headSize={0.5}
        headShape={tailShapeArrow1}
      />
    </>
  );
}
