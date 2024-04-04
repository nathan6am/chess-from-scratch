"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRefs = exports.removeUndefinedFields = exports.escapeSpecialChars = exports.notEmpty = exports.coinflip = void 0;
/**
 * Returns a coin flip of supplied args
 * @param a option a
 * @param b option b
 * @returns either a or b
 */
function coinflip(a, b) {
    return Math.random() < 0.5 ? a : b;
}
exports.coinflip = coinflip;
/**
 * Checks if a value is not null or undefined
 * @param value
 * @returns boolean
 */
function notEmpty(value) {
    return value !== null && value !== undefined;
}
exports.notEmpty = notEmpty;
/**
 * Clean up a string by escaping special characters
 * @param string raw string
 * @returns string with special characters escaped
 */
function escapeSpecialChars(string) {
    return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
exports.escapeSpecialChars = escapeSpecialChars;
/**
 * Removes undefined fields from an object for JSON serialization
 * @param object object to clean
 * @returns {{ [key: string]: any }} object with undefined fields removed
 */
function removeUndefinedFields(object) {
    return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}
exports.removeUndefinedFields = removeUndefinedFields;
/**
 * Merges multiple refs into a single ref callback
 * @param refs array of refs
 * @returns ref callback
 */
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
