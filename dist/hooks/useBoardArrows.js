"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useBoardArrows({ currentSquare, lockArrows, color: colorOverride, disabled, }) {
    const color = (0, react_1.useMemo)(() => {
        return colorOverride || "G";
    }, [colorOverride]);
    const [arrows, setArrows] = (0, react_1.useState)([]);
    const [markedSquares, setMarkedSquares] = (0, react_1.useState)([]);
    const [currentArrowStart, setCurrentArrowStart] = (0, react_1.useState)(null);
    const start = (Square) => {
        setCurrentArrowStart(currentSquare);
    };
    const currentArrow = (0, react_1.useMemo)(() => {
        if (!currentSquare || !currentArrowStart || currentArrowStart === currentSquare)
            return null;
        return {
            start: currentArrowStart,
            end: currentSquare,
            color: color,
        };
    }, [currentArrowStart, currentSquare, color]);
    const toggleMarkedSquare = (0, react_1.useCallback)((square) => {
        setMarkedSquares((cur) => {
            if (cur.some((marked) => marked.square === square))
                return cur.filter((marked) => marked.square !== square);
            else
                return [...cur, { square, color }];
        });
    }, [color]);
    const finalize = () => {
        if (currentArrow) {
            setArrows((cur) => {
                if (cur.some((arrow) => arrow.start === currentArrow.start && arrow.end === currentArrow.end)) {
                    return cur.filter((arrow) => !(arrow.start === currentArrow.start && arrow.end === currentArrow.end));
                }
                else {
                    return [...cur, currentArrow];
                }
            });
            setCurrentArrowStart(null);
        }
        else if (currentArrowStart) {
            if (currentSquare === currentArrowStart)
                toggleMarkedSquare(currentSquare);
            setCurrentArrowStart(null);
        }
    };
    const clear = () => {
        setArrows([]);
        setMarkedSquares([]);
    };
    (0, react_1.useEffect)(() => {
        if (disabled)
            return;
        const downhandler = (e) => {
            if (currentSquare) {
                if (e.button === 2)
                    start(currentSquare);
                //else clear();
            }
        };
        const uphandler = (e) => {
            if (e.button === 2) {
                finalize();
            }
        };
        const contextmenuHandler = (e) => {
            if (currentSquare)
                e.preventDefault();
        };
        document.addEventListener("mousedown", downhandler);
        document.addEventListener("mouseup", uphandler);
        document.addEventListener("contextmenu", contextmenuHandler);
        return () => {
            document.removeEventListener("mousedown", downhandler);
            document.removeEventListener("mouseup", uphandler);
            document.removeEventListener("contextmenu", contextmenuHandler);
        };
    }, [currentSquare, start, finalize, clear, lockArrows]);
    return {
        arrows,
        pendingArrow: currentArrow,
        start,
        finalize,
        clear,
        markedSquares,
    };
}
exports.default = useBoardArrows;
