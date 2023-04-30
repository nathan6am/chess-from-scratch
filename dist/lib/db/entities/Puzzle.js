"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Puzzle_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
let Puzzle = Puzzle_1 = class Puzzle extends typeorm_1.BaseEntity {
    id;
    fen;
    moves;
    rating;
    ratingDeviation;
    popularity;
    nbPlays;
    themes;
    gameUrl;
    openingFamily;
    openingVariation;
    static async getPuzzles(options) {
        const defaultOptions = {
            minRating: 0,
            maxRating: 4000,
            sampleSize: 25,
            excludeIds: null,
            themes: null,
        };
        const searchOptions = { ...defaultOptions, ...options };
        const { minRating, maxRating, sampleSize, excludeIds, themes } = searchOptions;
        let query = Puzzle_1.createQueryBuilder()
            .select()
            .where("rating BETWEEN :minRating AND :maxRating", { minRating, maxRating });
        if (themes) {
            query = query.andWhere("themes && :selectedThemes", { selectedThemes: themes });
        }
        if (excludeIds) {
            query = query.andWhere("id NOT IN (:...excludeIds)", { excludeIds });
        }
        query = query.orderBy("RANDOM()").limit(sampleSize);
        return await query.getMany();
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Puzzle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Puzzle.prototype, "fen", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Puzzle.prototype, "moves", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "ratingDeviation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "popularity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Puzzle.prototype, "nbPlays", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { array: true }),
    __metadata("design:type", Array)
], Puzzle.prototype, "themes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Puzzle.prototype, "gameUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Puzzle.prototype, "openingFamily", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Puzzle.prototype, "openingVariation", void 0);
Puzzle = Puzzle_1 = __decorate([
    (0, typeorm_1.Entity)()
], Puzzle);
exports.default = Puzzle;
