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
var User_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = exports.Credential = exports.CompletedPuzzle = exports.Notification = exports.NotificationType = void 0;
const typeorm_1 = require("typeorm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const settings_1 = require("../../../context/settings");
const misc_1 = require("../../../util/misc");
const User_Game_1 = __importDefault(require("./User_Game"));
const Puzzle_1 = __importDefault(require("./Puzzle"));
const Solved_Puzzle_1 = __importDefault(require("./Solved_Puzzle"));
const Collection_1 = __importDefault(require("./Collection"));
const Analysis_1 = __importDefault(require("./Analysis"));
const glicko_1 = require("../../../server/util/glicko");
const defaultRatings = {
    bullet: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
    },
    blitz: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
    },
    rapid: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
    },
    classical: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
    },
    puzzle: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
    },
    correspondence: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
    },
};
let User = User_1 = class User extends typeorm_1.BaseEntity {
    id;
    name;
    username;
    ratings;
    notifications;
    games;
    solvedPuzzles;
    collections;
    savedAnalyses;
    complete;
    get type() {
        if (!this.complete)
            return "incomplete";
        if (!this.emailVerified)
            return "unverified";
        return "user";
    }
    emailVerified;
    profile;
    credentials;
    static async usernameExists(username) {
        const exists = await this.findOne({
            where: {
                username: (0, typeorm_1.ILike)(`${(0, misc_1.escapeSpecialChars)(username)}`),
            },
        });
        if (exists)
            return true;
        return false;
    }
    static async login(credentials) {
        if (!credentials.email && !credentials.username)
            return null;
        if (credentials.email) {
            const user = await this.findOne({
                where: {
                    credentials: {
                        email: credentials.email,
                    },
                },
                relations: {
                    credentials: true,
                },
            });
            if (!user || !user.credentials)
                return null;
            const verified = await bcrypt_1.default.compare(credentials.password, user.credentials.hashedPassword);
            if (!verified)
                return null;
            return {
                username: user.username,
                id: user.id,
                type: user.type,
            };
        }
        if (credentials.username) {
            const user = await this.findOne({
                where: {
                    username: (0, typeorm_1.ILike)(`${(0, misc_1.escapeSpecialChars)(credentials.username)}`),
                },
                relations: {
                    credentials: true,
                },
            });
            if (!user || !user.credentials)
                return null;
            const verified = await bcrypt_1.default.compare(credentials.password, user.credentials.hashedPassword);
            if (!verified)
                return null;
            return {
                username: user.username,
                id: user.id,
                type: user.type,
            };
        }
        return null;
    }
    static async getSessionUser(id) {
        const user = await this.findOne({ where: { id } });
        if (!user)
            return undefined;
        return {
            id: user.id,
            username: user.username,
            type: user.type,
        };
    }
    static async loginWithFacebook(profile) {
        const user = await this.findOne({
            relations: {
                credentials: true,
            },
            where: {
                credentials: {
                    facebookId: profile.facebookId,
                },
            },
        });
        if (user) {
            // console.log(user.credentials);
            const { id, username, type } = user;
            // console.log(id, username, type);
            return { id, username, type };
        }
        const newUser = new User_1();
        newUser.emailVerified = true;
        const credentials = new Credential();
        credentials.facebookId = profile.facebookId;
        Object.assign(newUser, {
            name: profile.name,
        });
        newUser.credentials = credentials;
        await newUser.save();
        return {
            id: newUser.id,
            username: null,
            type: newUser.type,
        };
    }
    static async loginWithGoogle(profile) {
        const user = await this.findOne({
            relations: {
                credentials: true,
            },
            where: {
                credentials: {
                    googleId: profile.googleId,
                },
            },
        });
        if (user) {
            console.log(user.credentials);
            const { id, username, type } = user;
            console.log(id, username, type);
            return { id, username, type };
        }
        const newUser = new User_1();
        const credentials = new Credential();
        credentials.googleId = profile.googleId;
        Object.assign(newUser, {
            name: profile.name,
        });
        newUser.emailVerified = true;
        newUser.credentials = credentials;
        await newUser.save();
        return {
            id: newUser.id,
            username: null,
            type: newUser.type,
        };
    }
    static async createAccountWithCredentials(account) {
        const { email, username, password } = account;
        const exists = await this.createQueryBuilder("user")
            .leftJoinAndSelect("user.credentials", "credentials")
            .where("credentials.email = :email", { email: account.email })
            .orWhere("LOWER(user.username) = LOWER(:username)", {
            username: account.username,
        })
            .getExists();
        if (exists) {
            return {
                created: null,
                fieldErrors: [{ field: "email", message: "Email address is already in use" }],
            };
        }
        const user = new User_1();
        const credentials = new Credential();
        const hash = bcrypt_1.default.hashSync(password, 10);
        credentials.hashedPassword = hash;
        credentials.email = email;
        user.credentials = credentials;
        Object.assign(user, { username });
        await user.save();
        if (!user) {
            return {
                created: null,
                fieldErrors: [{ field: "none", message: "Unable to create account" }],
            };
        }
        const created = { id: user.id, username: user.username, type: user.type };
        return { created: created };
    }
    static async updateCredentials(userid, currentPassword, newPassword) {
        const user = await this.findOne({
            where: { id: userid },
            relations: { credentials: true },
        });
        if (user && bcrypt_1.default.compareSync(currentPassword, user.credentials.hashedPassword)) {
            user.credentials.hashedPassword = bcrypt_1.default.hashSync(newPassword, 10);
            await user.save();
            return true;
        }
        return false;
    }
    static async getCollections(id) {
        const user = await this.findOne({
            where: { id: id },
            relations: {
                collections: {
                    analyses: {
                        collections: true,
                    },
                },
            },
        });
        return user?.collections || [];
    }
    static async getProfile(id) {
        const user = await this.findOne({
            where: {
                id,
            },
            relations: {
                profile: true,
                games: {
                    game: {
                        players: {
                            user: true,
                        },
                    },
                },
            },
        });
        return user;
    }
    static async findById(id) {
        const user = await this.findOneBy({ id });
        return user;
    }
    static async updateRatings(category, updates) {
        updates.forEach(async (update) => {
            const user = await this.findOneBy({ id: update.id });
            if (!user)
                return;
            user.ratings[category] = update.newRating;
            await user.save();
        });
    }
    static async createProfile(id, profileData) {
        const user = await this.findOneBy({ id });
        if (!user)
            throw new Error("User does not exist");
        if (user.type === "user")
            throw new Error("user already has profile");
        const profile = new Profile();
        Object.assign(profile, profileData);
        user.profile = profile;
        await user.save();
    }
    static async updateProfile(id, profileData) {
        const user = await this.findOne({ where: { id }, relations: { profile: true } });
        if (!user)
            throw new Error("User does not exist");
        Object.assign(user.profile, profileData);
        const updated = await user.save();
        return updated.profile;
    }
    static async getGames(id) {
        const user = await this.findOne({
            where: { id: id },
            relations: {
                games: {
                    game: {
                        players: {
                            user: true,
                        },
                    },
                },
            },
        });
        const usergames = user?.games || [];
        const result = usergames.map((usergame) => {
            const filteredPlayers = usergame.game.players.map((player) => ({
                username: player.user.username,
                rating: player.rating,
                color: player.color,
            }));
            return {
                ...usergame,
                game: {
                    ...usergame.game,
                    players: filteredPlayers,
                },
            };
        });
        return result;
    }
    static async solvePuzzle(puzzleid, userid, result, rated = true) {
        const solvedPuzzle = new Solved_Puzzle_1.default();
        const puzzle = await Puzzle_1.default.findOneBy({ id: puzzleid });
        if (!puzzle)
            throw new Error("Puzzle does not exist");
        solvedPuzzle.puzzle = puzzle;
        const user = await User_1.findOneBy({ id: userid });
        if (!user)
            throw new Error("User does not exist");
        solvedPuzzle.user = user;
        solvedPuzzle.result = result;
        solvedPuzzle.date = new Date();
        await solvedPuzzle.save();
        if (rated) {
            const puzzleRating = {
                rating: puzzle.rating,
                ratingDeviation: 50,
                volatility: 0.06,
                gameCount: 1,
            };
            const userRating = user.ratings.puzzle;
            const [newRating] = (0, glicko_1.updateRatings)(userRating, puzzleRating, result === "solved" ? 1 : result === "solved-w-hint" ? 0.5 : 0);
            user.ratings.puzzle = newRating;
            await user.save();
        }
        return solvedPuzzle;
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
    (0, typeorm_1.Column)("jsonb", { default: defaultRatings }),
    __metadata("design:type", Object)
], User.prototype, "ratings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Notification, (notifcation) => notifcation.user),
    __metadata("design:type", Object)
], User.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_Game_1.default, (userGame) => userGame.user, { cascade: true }),
    __metadata("design:type", Object)
], User.prototype, "games", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Solved_Puzzle_1.default, (solvedPuzzle) => solvedPuzzle.user, { cascade: true }),
    __metadata("design:type", Object)
], User.prototype, "solvedPuzzles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Collection_1.default, (collection) => collection.user),
    __metadata("design:type", Object)
], User.prototype, "collections", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Analysis_1.default, (analysis) => analysis.author),
    __metadata("design:type", Object)
], User.prototype, "savedAnalyses", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "complete", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Profile, (profile) => profile.id, { cascade: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Object)
], User.prototype, "profile", void 0);
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
    id;
    created_at;
    acknowledged;
    type;
    data;
    message;
    user;
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
let CompletedPuzzle = class CompletedPuzzle {
    user_id;
    puzzle_id;
    user;
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
    id;
    hashedPassword;
    facebookId;
    googleId;
    email;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Credential.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Credential.prototype, "hashedPassword", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], Credential.prototype, "facebookId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], Credential.prototype, "googleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Credential.prototype, "email", void 0);
Credential = __decorate([
    (0, typeorm_1.Entity)()
], Credential);
exports.Credential = Credential;
let Profile = class Profile {
    id;
    bio;
    country;
    settings;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Profile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Profile.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Profile.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: settings_1.defaultSettings }),
    __metadata("design:type", Object)
], Profile.prototype, "settings", void 0);
Profile = __decorate([
    (0, typeorm_1.Entity)()
], Profile);
exports.Profile = Profile;
