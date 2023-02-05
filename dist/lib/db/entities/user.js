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
var User_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = exports.CompletedPuzzle = exports.Analysis = exports.Notification = exports.NotificationType = void 0;
const typeorm_1 = require("typeorm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const settings_1 = require("../../../context/settings");
const misc_1 = require("../../../util/misc");
const User_Game_1 = __importDefault(require("./User_Game"));
let User = User_1 = class User extends typeorm_1.BaseEntity {
    static usernameExists(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield this.findOne({
                where: {
                    username: (0, typeorm_1.ILike)(`${(0, misc_1.escapeSpecialChars)(username)}`),
                },
            });
            if (exists)
                return true;
            return false;
        });
    }
    static login(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!credentials.email && !credentials.username)
                return null;
            if (credentials.email) {
                const user = yield this.findOne({
                    where: {
                        email: credentials.email,
                    },
                    relations: {
                        credentials: true,
                    },
                });
                if (!user || !user.credentials)
                    return null;
                const verified = yield bcrypt_1.default.compare(credentials.password, user.credentials.hashedPassword);
                if (!verified)
                    return null;
                return {
                    username: user.username,
                    id: user.id,
                    type: user.profileComplete ? "user" : "incomplete",
                };
            }
            if (credentials.username) {
                const user = yield this.findOne({
                    where: {
                        username: (0, typeorm_1.ILike)(`${(0, misc_1.escapeSpecialChars)(credentials.username)}`),
                    },
                    relations: {
                        credentials: true,
                    },
                });
                if (!user || !user.credentials)
                    return null;
                const verified = yield bcrypt_1.default.compare(credentials.password, user.credentials.hashedPassword);
                if (!verified)
                    return null;
                return {
                    username: user.username,
                    id: user.id,
                    type: user.profileComplete ? "user" : "incomplete",
                };
            }
            return null;
        });
    }
    static getSessionUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findOne({ where: { id } });
            if (!user)
                return undefined;
            return {
                id: user.id,
                username: user.username,
                type: user.profileComplete ? "user" : "incomplete",
            };
        });
    }
    static loginWithFacebook(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findOne({
                where: {
                    facebookId: profile.facebookId,
                },
            });
            if (user) {
                const { id, username, profileComplete } = user;
                return { id, username, type: profileComplete ? "user" : "incomplete" };
            }
            const newUser = new User_1();
            Object.assign(newUser, {
                facebookId: profile.facebookId,
                name: profile.name,
            });
            yield newUser.save();
            return {
                id: newUser.id,
                username: null,
                type: "incomplete",
            };
        });
    }
    static createAccountWithCredentials(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, username, password } = account;
            const exists = yield this.createQueryBuilder("user")
                .where("user.email = :email", { email: account.email })
                .orWhere("LOWER(user.username) = LOWER(:username)", {
                username: account.username,
            })
                .getExists();
            if (exists) {
                return {
                    created: null,
                    fieldErrors: [
                        { field: "email", message: "Email address is already in use" },
                    ],
                };
            }
            const user = new User_1();
            const credentials = new Credential();
            const hash = bcrypt_1.default.hashSync(account.password, 10);
            credentials.hashedPassword = hash;
            user.credentials = credentials;
            Object.assign(user, { email, username });
            yield user.save();
            if (!user) {
                return {
                    created: null,
                    fieldErrors: [{ field: "none", message: "Unable to create account" }],
                };
            }
            const created = { id: user.id, username: user.username };
            return { created: created };
        });
    }
    static updateCredentials(username, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findOne({
                where: { username: username },
                relations: { credentials: true },
            });
            if (user) {
                user.credentials.hashedPassword = bcrypt_1.default.hashSync(newPassword, 10);
                user.save();
            }
        });
    }
    static getProfile(id) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(id);
            const user = yield this.findOneBy({ id: id });
            console.log(user);
            return user;
        });
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 800 }),
    __metadata("design:type", Number)
], User.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "facebookId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "googleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Notification, (notifcation) => notifcation.user),
    __metadata("design:type", Object)
], User.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_Game_1.default, (userGame) => userGame.user),
    __metadata("design:type", Object)
], User.prototype, "games", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Analysis, (analysis) => analysis.creator),
    __metadata("design:type", Object)
], User.prototype, "savedAnalyses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: settings_1.defaultSettings }),
    __metadata("design:type", Object)
], User.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "profileComplete", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Credential, (credential) => credential.id, { cascade: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Object)
], User.prototype, "credentials", void 0);
User = User_1 = __decorate([
    (0, typeorm_1.Entity)()
], User);
exports.default = User;
var NotificationType;
(function (NotificationType) {
    NotificationType["REQUEST_ACCEPTED"] = "request-accepted";
    NotificationType["REQUEST_DECLINED"] = "request-declined";
    NotificationType["REQUEST_RECIEVED"] = "request-recieved";
    NotificationType["CHALLENGE_ACCEPTED"] = "challenge-accepted";
    NotificationType["CHALLENGE_DECLINED"] = "challenge-declined";
    NotificationType["CHALLENGE_RECIEVED"] = "challenge-recieved";
    NotificationType["MESSAGE"] = "message";
    NotificationType["ADMIN_MESSAGE"] = "admin-message";
    NotificationType["CORRESPONDENCE_MOVE"] = "correspondence-move";
    NotificationType["CORRESPONDENCE_RESULT"] = "correspondence-result";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
let Notification = class Notification {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Notification.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Notification.prototype, "acknowledged", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: NotificationType }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], Notification.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Notification.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.notifications),
    __metadata("design:type", Object)
], Notification.prototype, "user", void 0);
Notification = __decorate([
    (0, typeorm_1.Entity)()
], Notification);
exports.Notification = Notification;
let Analysis = class Analysis {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Analysis.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], Analysis.prototype, "tree", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.savedAnalyses),
    (0, typeorm_1.JoinColumn)({ name: "creator_id" }),
    __metadata("design:type", Object)
], Analysis.prototype, "creator", void 0);
Analysis = __decorate([
    (0, typeorm_1.Entity)()
], Analysis);
exports.Analysis = Analysis;
let CompletedPuzzle = class CompletedPuzzle {
};
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], CompletedPuzzle.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], CompletedPuzzle.prototype, "puzzle_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.id),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", Object)
], CompletedPuzzle.prototype, "user", void 0);
CompletedPuzzle = __decorate([
    (0, typeorm_1.Entity)()
], CompletedPuzzle);
exports.CompletedPuzzle = CompletedPuzzle;
let Credential = class Credential {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Credential.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Credential.prototype, "hashedPassword", void 0);
Credential = __decorate([
    (0, typeorm_1.Entity)()
], Credential);
exports.Credential = Credential;
