"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorEnum = void 0;
const react_1 = __importStar(require("react"));
const react_xarrows_1 = __importStar(require("react-xarrows"));
exports.ColorEnum = {
    R: "#b91c1c",
    G: "#15803d",
    O: "#b45309",
    B: "#0369a1",
    Y: "#eab308",
};
const headShapeArrow1 = {
    svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0 0 z"/>,
    offsetForward: 0.005,
};
const cornerShapeArrow1 = {
    svgElem: <path d="M 0 0.01 L 0.5 0.01 L 0.5 1.01 L 0 1.01 z"/>,
    offsetForward: 0.005,
};
const tailShapeArrow1 = {
    svgElem: <path d=""/>,
};
function BoardArrows({ children, arrows, pendingArrow, squareIdPrefix, squareSize }) {
    const arrowSize = (0, react_1.useMemo)(() => {
        if (squareSize < 55)
            return "sm";
        if (squareSize < 70)
            return "md";
        return "lg";
    }, [squareSize]);
    return (<react_xarrows_1.Xwrapper>
      <>
        {arrows.map((arrow) => (<RenderArrow size={arrowSize} idPrefix={squareIdPrefix} arrow={arrow} key={`${arrow.start}${arrow.end}`}/>))}
      </>
      <>{pendingArrow && <RenderArrow size={arrowSize} idPrefix={squareIdPrefix} arrow={pendingArrow}/>}</>
      <>{children}</>
    </react_xarrows_1.Xwrapper>);
}
exports.default = BoardArrows;
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
function RenderArrow({ arrow, idPrefix, size = "lg" }) {
    const { strokeWidth, headSize, tailSize } = (0, react_1.useMemo)(() => arrowSize[size], [size]);
    if (arrow.end) {
        return (<react_xarrows_1.default SVGcanvasProps={{ className: "opacity-60 pointer-none" }} start={(idPrefix || "") + arrow.start} end={(idPrefix || "") + arrow.end} path={"straight"} startAnchor="middle" endAnchor="middle" color={exports.ColorEnum[arrow.color]} zIndex={17} strokeWidth={strokeWidth} headSize={headSize} headShape={headShapeArrow1} showTail tailShape={tailShapeArrow1} tailSize={tailSize}/>);
    }
    return <></>;
}
function KnightArrow() {
    return (<>
      <react_xarrows_1.default SVGcanvasProps={{ className: "opacity-60 pointer-none" }} start={"g1"} end={"g3"} path={"straight"} startAnchor="middle" endAnchor="middle" color={"#b45309"} zIndex={17} strokeWidth={18} headSize={0.5} headShape={tailShapeArrow1} showTail tailShape={tailShapeArrow1} tailSize={1}/>
      <react_xarrows_1.default SVGcanvasProps={{ className: "opacity-60 pointer-none" }} start={"g3"} end={"f3"} path={"straight"} startAnchor="middle" endAnchor="middle" color={"#b45309"} zIndex={17} strokeWidth={18} headSize={0.5} headShape={tailShapeArrow1}/>
    </>);
}
