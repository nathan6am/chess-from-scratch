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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const User_1 = __importDefault(require("./User"));
const Puzzle_1 = __importDefault(require("./Puzzle"));
let Solved_Puzzle = class Solved_Puzzle extends typeorm_1.BaseEntity {
    id;
    user;
    puzzle;
    result;
    attempts;
    date;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Solved_Puzzle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.default, (user) => user.solvedPuzzles),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", Object)
], Solved_Puzzle.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Puzzle_1.default, (puzzle) => puzzle),
    (0, typeorm_1.JoinColumn)({ name: "puzzle_id" }),
    __metadata("design:type", Object)
], Solved_Puzzle.prototype, "puzzle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Solved_Puzzle.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Solved_Puzzle.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Solved_Puzzle.prototype, "date", void 0);
Solved_Puzzle = __decorate([
    (0, typeorm_1.Entity)()
], Solved_Puzzle);
exports.default = Solved_Puzzle;
