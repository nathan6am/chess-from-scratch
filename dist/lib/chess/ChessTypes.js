"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEnum = exports.isSquare = void 0;
function isSquare(str) {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    if (str.length !== 2)
        return false;
    const file = str.charAt(0);
    const rank = parseInt(str.charAt(1));
    if (!files.includes(file))
        return false;
    if (rank < 1 || rank > 8)
        return false;
    return true;
}
exports.isSquare = isSquare;
var FileEnum;
(function (FileEnum) {
    FileEnum[FileEnum["a"] = 0] = "a";
    FileEnum[FileEnum["b"] = 1] = "b";
    FileEnum[FileEnum["c"] = 2] = "c";
    FileEnum[FileEnum["d"] = 3] = "d";
    FileEnum[FileEnum["e"] = 4] = "e";
    FileEnum[FileEnum["f"] = 5] = "f";
    FileEnum[FileEnum["g"] = 6] = "g";
    FileEnum[FileEnum["h"] = 7] = "h";
})(FileEnum = exports.FileEnum || (exports.FileEnum = {}));
