import React from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import { Square } from "@/lib/chess";
interface Arrow {
  start: Square;
  end: Square;
  color: string;
}
interface Props {
  children?: JSX.Element | JSX.Element[];
  arrows?: Arrow[];
}

const headShapeArrow1 = {
  svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0 0 z" />,
  offsetForward: 0.005,
};
export default function BoardArrows({ children }: Props) {
  return (
    <Xwrapper>
      <Xarrow
        SVGcanvasProps={{ className: "opacity-60" }}
        start={"f1"}
        end={"g2"}
        path={"straight"}
        startAnchor="middle"
        endAnchor="middle"
        color="rgba(22, 101, 52)"
        zIndex={30}
        strokeWidth={24}
        headSize={2.5}
        headShape={headShapeArrow1}
      />
      <Xarrow
        SVGcanvasProps={{ className: "opacity-60" }}
        start={"g1"}
        end={"f3"}
        path={"straight"}
        startAnchor="middle"
        endAnchor="middle"
        color="rgba(185, 28, 28)"
        zIndex={30}
        strokeWidth={24}
        headSize={2.5}
        headShape={headShapeArrow1}
      />
      <>{children}</>
    </Xwrapper>
  );
}
