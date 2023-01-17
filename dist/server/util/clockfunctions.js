"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchClock = exports.currentISO = exports.currentTimeRemaining = exports.timeElapsedMs = void 0;
var luxon_1 = require("luxon");
function timeElapsedMs(startTimeISO, endTimeISO) {
    var startTime = luxon_1.DateTime.fromISO(startTimeISO);
    if (endTimeISO) {
        var endTime = luxon_1.DateTime.fromISO(endTimeISO);
        return Math.abs(startTime.diff(endTime).toMillis());
    }
    return Math.abs(startTime.diffNow().toMillis());
}
exports.timeElapsedMs = timeElapsedMs;
function currentTimeRemaining(lastMoveTimeISO, timeRemainingMs) {
    var lastMoveTime = luxon_1.DateTime.fromISO(lastMoveTimeISO);
    var elapedFromLastMove = Math.abs(lastMoveTime.diffNow().toMillis());
    return timeRemainingMs - elapedFromLastMove;
}
exports.currentTimeRemaining = currentTimeRemaining;
function currentISO() {
    return luxon_1.DateTime.now().toISO();
}
exports.currentISO = currentISO;
function switchClock(clock, moveRecievedISO, moveColor, lagCompMs) {
    if (!clock.lastMoveTimeISO) {
        return __assign(__assign({}, clock), { lastMoveTimeISO: luxon_1.DateTime.now().toISO() });
    }
    var initialRemaining = clock.timeRemainingMs[moveColor];
    var elapsed = timeElapsedMs(clock.lastMoveTimeISO, moveRecievedISO);
    var timeRemaining = initialRemaining - elapsed + clock.incrementMs + (lagCompMs || 100);
    clock.timeRemainingMs[moveColor] = timeRemaining;
    return __assign(__assign({}, clock), { lastMoveTimeISO: luxon_1.DateTime.now().toISO() });
}
exports.switchClock = switchClock;
