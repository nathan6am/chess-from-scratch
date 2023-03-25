"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useArrowState = void 0;
const react_1 = require("react");
function useBoardMarkup({ currentSquare, lockArrows, color, disabled, onArrow, onMarkSquare }) {
    const [currentArrowStart, setCurrentArrowStart] = (0, react_1.useState)(null);
    const start = (square) => {
        setCurrentArrowStart(square);
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
    const finalize = () => {
        if (currentArrow) {
            onArrow(currentArrow);
            setCurrentArrowStart(null);
        }
        else if (currentArrowStart && currentArrowStart === currentSquare) {
            onMarkSquare({ color, square: currentArrowStart });
            setCurrentArrowStart(null);
        }
        else {
            setCurrentArrowStart(null);
        }
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
    }, [currentSquare, start, finalize, lockArrows]);
    return currentArrow;
}
exports.default = useBoardMarkup;
function useArrowState() {
    const [arrows, setArrows] = (0, react_1.useState)([]);
    const [markedSquares, setMarkedSquares] = (0, react_1.useState)([]);
    const onArrow = (newArrow) => {
        setArrows((current) => {
            if (current.some((arrow) => arrow.start === newArrow.start && arrow.end === newArrow.end)) {
                return current.filter((arrow) => !(arrow.start === newArrow.start && arrow.end === newArrow.end));
            }
            else {
                return [...current, newArrow];
            }
        });
    };
    const onMarkSquare = (markedSquare) => {
        setMarkedSquares((current) => {
            if (current.some((square) => square.square === markedSquare.square)) {
                return current.filter((square) => square.square !== markedSquare.square);
            }
            else {
                return [...current, markedSquare];
            }
        });
    };
    const clear = () => {
        setArrows([]);
        setMarkedSquares([]);
    };
    return {
        arrows,
        markedSquares,
        onArrow,
        onMarkSquare,
        clear,
    };
}
exports.useArrowState = useArrowState;
