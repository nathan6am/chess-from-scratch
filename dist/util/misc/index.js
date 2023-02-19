"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRefs = exports.removeUndefinedFields = exports.escapeSpecialChars = exports.notEmpty = exports.coinflip = void 0;
function coinflip(a, b) {
    return Math.random() < 0.5 ? a : b;
}
exports.coinflip = coinflip;
function notEmpty(value) {
    return value !== null && value !== undefined;
}
exports.notEmpty = notEmpty;
function escapeSpecialChars(string) {
    return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
exports.escapeSpecialChars = escapeSpecialChars;
const removeUndefinedFields = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};
exports.removeUndefinedFields = removeUndefinedFields;
function mergeRefs(refs) {
    return (value) => {
        refs.forEach((ref) => {
            if (typeof ref === "function") {
                ref(value);
            }
            else if (ref != null) {
                ref.current = value;
            }
        });
    };
}
exports.mergeRefs = mergeRefs;
