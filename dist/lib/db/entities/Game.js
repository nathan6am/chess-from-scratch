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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Game_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const User_Game_1 = __importDefault(require("./User_Game"));
const User_1 = __importDefault(require("./User"));
let Game = Game_1 = class Game extends typeorm_1.BaseEntity {
    static saveGame(players, outcome, data, timeControl, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = new Game_1();
            Object.assign(game, { id, outcome, data, timeControl });
            game.players = [];
            yield game.save();
            Object.entries(players).forEach(([color, player]) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                if (player.user.type === "guest") {
                    game.guestPlayer = { username: player.username, color: color };
                }
                else {
                    const user = yield User_1.default.findOneBy({ id: player.id });
                    if (user) {
                        const userGame = new User_Game_1.default();
                        userGame.user = user;
                        userGame.game = game;
                        userGame.color = color;
                        userGame.result =
                            ((_a = userGame.game.outcome) === null || _a === void 0 ? void 0 : _a.result) === "d"
                                ? "draw"
                                : ((_b = userGame.game.outcome) === null || _b === void 0 ? void 0 : _b.result) === color
                                    ? "win"
                                    : "loss";
                        if (user.rating)
                            userGame.rating = user.rating;
                        console.log(userGame);
                        yield userGame.save();
                        game.players.push(userGame);
                    }
                }
            }));
            const final = yield game.save();
            return final;
        });
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
    (0, typeorm_1.OneToMany)(() => User_Game_1.default, (userGame) => userGame.game, { cascade: true }),
    __metadata("design:type", Object)
], Game.prototype, "players", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { nullable: true }),
    __metadata("design:type", Object)
], Game.prototype, "guestPlayer", void 0);
Game = Game_1 = __decorate([
    (0, typeorm_1.Entity)()
], Game);
exports.default = Game;
