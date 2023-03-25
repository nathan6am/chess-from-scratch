import React from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import { Square } from "@/lib/chess";
import { ArrowColor } from "@/hooks/useBoardMarkup";
export const ColorEnum: Record<ArrowColor, string> = {
  R: "#b91c1c",
  G: "#15803d",
  O: "#b45309",
  B: "#0369a1",
};
export interface Arrow {
  start: Square;
  end: Square;
  color: ArrowColor;
}
interface Props {
  children?: JSX.Element | JSX.Element[];
  arrows: Arrow[];
  pendingArrow?: Arrow | null;
}

const headShapeArrow1 = {
  svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0 0 z" />,
  offsetForward: 0.005,
};
export default function BoardArrows({ children, arrows, pendingArrow }: Props) {
  return (
    <Xwrapper>
      <>
        {arrows.map((arrow) => (
          <RenderArrow arrow={arrow} key={`${arrow.start}${arrow.end}`} />
        ))}
      </>
      <>{pendingArrow && <RenderArrow arrow={pendingArrow} />}</>
      <>{children}</>
    </Xwrapper>
  );
}

interface ArrowProps {
  arrow: Arrow;
}

function RenderArrow({ arrow }: ArrowProps) {
  if (arrow.end) {
    return (
      <Xarrow
        SVGcanvasProps={{ className: "opacity-60 pointer-none" }}
        start={arrow.start}
        end={arrow.end}
        path={"straight"}
        startAnchor="middle"
        endAnchor="middle"
        color={ColorEnum[arrow.color]}
        zIndex={17}
        strokeWidth={20}
        headSize={2.5}
        headShape={headShapeArrow1}
      />
    );
  }
  return <></>;
}
