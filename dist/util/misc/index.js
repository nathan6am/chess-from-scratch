"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coinflip = void 0;
function coinflip(a, b) {
    return Math.random() < 0.5 ? a : b;
}
exports.coinflip = coinflip;
