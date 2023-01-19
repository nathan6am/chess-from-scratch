"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchClock = exports.currentISO = exports.currentTimeRemaining = exports.timeElapsedMs = void 0;
const luxon_1 = require("luxon");
function timeElapsedMs(startTimeISO, endTimeISO) {
    const startTime = luxon_1.DateTime.fromISO(startTimeISO);
    if (endTimeISO) {
        const endTime = luxon_1.DateTime.fromISO(endTimeISO);
        return Math.abs(startTime.diff(endTime).toMillis());
    }
    return Math.abs(startTime.diffNow().toMillis());
}
exports.timeElapsedMs = timeElapsedMs;
function currentTimeRemaining(lastMoveTimeISO, timeRemainingMs) {
    const lastMoveTime = luxon_1.DateTime.fromISO(lastMoveTimeISO);
    const elapedFromLastMove = Math.abs(lastMoveTime.diffNow().toMillis());
    return timeRemainingMs - elapedFromLastMove;
}
exports.currentTimeRemaining = currentTimeRemaining;
function currentISO() {
    return luxon_1.DateTime.now().toISO();
}
exports.currentISO = currentISO;
function switchClock(clock, moveRecievedISO, moveColor, lagCompMs) {
    if (!clock.lastMoveTimeISO) {
        return Object.assign(Object.assign({}, clock), { lastMoveTimeISO: luxon_1.DateTime.now().toISO() });
    }
    const initialRemaining = clock.timeRemainingMs[moveColor];
    const elapsed = timeElapsedMs(clock.lastMoveTimeISO, moveRecievedISO);
    const timeRemaining = initialRemaining - elapsed + clock.incrementMs + (lagCompMs || 100);
    clock.timeRemainingMs[moveColor] = timeRemaining;
    return Object.assign(Object.assign({}, clock), { lastMoveTimeISO: luxon_1.DateTime.now().toISO() });
}
exports.switchClock = switchClock;
