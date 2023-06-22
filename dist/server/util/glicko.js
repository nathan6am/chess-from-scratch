"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPuzzlePerformance = exports.updateRatings = void 0;
const glicko2 = require("glicko2");
const config = {
    tau: 0.5,
    rating: 1500,
    rd: 350,
    vol: 0.06,
};
function updateRatings(ratingA, ratingB, result) {
    const glicko = new glicko2.Glicko2(config);
    let matches = [];
    const playerA = glicko.makePlayer(ratingA.rating, ratingA.ratingDeviation, ratingA.volatility);
    const playerB = glicko.makePlayer(ratingB.rating, ratingB.ratingDeviation, ratingB.volatility);
    matches.push([playerA, playerB, result]);
    glicko.updateRatings(matches);
    const newRatingA = {
        rating: Math.round(playerA.getRating()),
        ratingDeviation: Math.round(playerA.getRd()),
        volatility: parseFloat(playerA.getVol().toFixed(4)),
        gameCount: ratingA.gameCount + 1,
    };
    const newRatingB = {
        rating: Math.round(playerB.getRating()),
        ratingDeviation: Math.round(playerB.getRd()),
        volatility: parseFloat(playerB.getVol().toFixed(4)),
        gameCount: ratingB.gameCount + 1,
    };
    return [newRatingA, newRatingB];
}
exports.updateRatings = updateRatings;
function getPuzzlePerformance(userRating, puzzles) {
    const glicko = new glicko2.Glicko2(config);
    let matches = [];
    const player = glicko.makePlayer(userRating.rating, userRating.ratingDeviation, userRating.volatility);
    puzzles.forEach((puzzle) => {
        const opponent = glicko.makePlayer(puzzle.rating, 50, 0.06);
        matches.push([player, opponent, puzzle.result]);
    });
    glicko.updateRatings(matches);
    return Math.round(player.getRating());
}
exports.getPuzzlePerformance = getPuzzlePerformance;
