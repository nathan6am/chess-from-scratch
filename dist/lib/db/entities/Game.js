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
var Game_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const chess_1 = require("../../chess");
const User_Game_1 = __importDefault(require("./User_Game"));
const User_1 = __importDefault(require("./User"));
let Game = Game_1 = class Game extends typeorm_1.BaseEntity {
    id;
    timeControl;
    outcome;
    pgn;
    data;
    ratingCategory;
    rated;
    players;
    guestPlayer;
    isCorrespondence;
    date;
    static async saveGame(players, outcome, data, timeControl, pgn, id) {
        const game = new Game_1();
        Object.assign(game, { id, outcome, data, timeControl, pgn });
        game.players = [];
        game.ratingCategory = (0, chess_1.inferRatingCategeory)(timeControl);
        game.date = new Date();
        await game.save();
        Object.entries(players).forEach(async ([color, player]) => {
            if (player.type === "guest") {
                game.guestPlayer = { username: player.username || "", color: color };
            }
            else {
                const user = await User_1.default.findOneBy({ id: player.id });
                if (user) {
                    const opponent = players[color === "w" ? "b" : "w"];
                    const userGame = new User_Game_1.default();
                    userGame.user = user;
                    userGame.game = game;
                    userGame.color = color;
                    userGame.ratingCategory = game.ratingCategory;
                    if (opponent.id)
                        userGame.opponentId = opponent.id;
                    if (opponent.rating)
                        userGame.opponentRating = opponent.rating;
                    userGame.result =
                        userGame.game.outcome?.result === "d" ? "draw" : userGame.game.outcome?.result === color ? "win" : "loss";
                    if (player.rating)
                        userGame.rating = player.rating;
                    await userGame.save();
                    game.players.push(userGame);
                }
            }
        });
        const final = await game.save();
        return final;
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Game.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { nullable: true }),
    __metadata("design:type", Object)
], Game.prototype, "timeControl", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb"),
    __metadata("design:type", Object)
], Game.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Game.prototype, "pgn", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb"),
    __metadata("design:type", Function)
], Game.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Game.prototype, "ratingCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Game.prototype, "rated", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_Game_1.default, (userGame) => userGame.game, { cascade: true }),
    __metadata("design:type", Object)
], Game.prototype, "players", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { nullable: true }),
    __metadata("design:type", Object)
], Game.prototype, "guestPlayer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Game.prototype, "isCorrespondence", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Game.prototype, "date", void 0);
Game = Game_1 = __decorate([
    (0, typeorm_1.Entity)()
], Game);
exports.default = Game;
