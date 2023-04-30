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
var Collection_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Analysis_1 = __importDefault(require("./Analysis"));
const User_1 = __importDefault(require("./User"));
let Collection = Collection_1 = class Collection extends typeorm_1.BaseEntity {
    id;
    title;
    analyses;
    user;
    static async getByIds(ids) {
        const collections = await this.findBy({
            id: (0, typeorm_1.In)(ids),
        });
        return collections;
    }
    static async userCollections(userid) {
        const collections = await this.find({
            where: {
                user: { id: userid },
            },
        });
        return collections;
    }
    static async createNew(title, user) {
        const collection = new Collection_1();
        Object.assign(collection, { title, user });
        await collection.save();
        return collection;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Collection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Collection.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Analysis_1.default, (analysis) => analysis.collections),
    __metadata("design:type", Object)
], Collection.prototype, "analyses", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, (user) => user.collections),
    __metadata("design:type", Object)
], Collection.prototype, "user", void 0);
Collection = Collection_1 = __decorate([
    (0, typeorm_1.Entity)()
], Collection);
exports.default = Collection;
