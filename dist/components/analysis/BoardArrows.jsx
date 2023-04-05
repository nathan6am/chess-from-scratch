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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorEnum = void 0;
const react_1 = __importDefault(require("react"));
const react_xarrows_1 = __importStar(require("react-xarrows"));
exports.ColorEnum = {
    R: "#b91c1c",
    G: "#15803d",
    O: "#b45309",
    B: "#0369a1",
};
const headShapeArrow1 = {
    svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0 0 z"/>,
    offsetForward: 0.005,
};
function BoardArrows({ children, arrows, pendingArrow }) {
    return (<react_xarrows_1.Xwrapper>
      <>
        {arrows.map((arrow) => (<RenderArrow arrow={arrow} key={`${arrow.start}${arrow.end}`}/>))}
      </>
      <>{pendingArrow && <RenderArrow arrow={pendingArrow}/>}</>
      <>{children}</>
    </react_xarrows_1.Xwrapper>);
}
exports.default = BoardArrows;
function RenderArrow({ arrow }) {
    if (arrow.end) {
        return (<react_xarrows_1.default SVGcanvasProps={{ className: "opacity-60 pointer-none" }} start={arrow.start} end={arrow.end} path={"straight"} startAnchor="middle" endAnchor="middle" color={exports.ColorEnum[arrow.color]} zIndex={17} strokeWidth={20} headSize={2.5} headShape={headShapeArrow1}/>);
    }
    return <></>;
}
