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
const Game_1 = __importDefault(require("./Game"));
let User_Game = class User_Game extends typeorm_1.BaseEntity {
    id;
    user;
    game;
    color;
    result;
    rating;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User_Game.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, (user) => user.games),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", Object)
], User_Game.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Game_1.default, (game) => game.players),
    (0, typeorm_1.JoinColumn)({ name: "game_id", referencedColumnName: "id" }),
    __metadata("design:type", Object)
], User_Game.prototype, "game", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], User_Game.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], User_Game.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], User_Game.prototype, "rating", void 0);
User_Game = __decorate([
    (0, typeorm_1.Entity)()
], User_Game);
exports.default = User_Game;
