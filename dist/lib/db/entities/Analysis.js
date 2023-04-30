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
var Analysis_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const User_1 = __importDefault(require("./User"));
const Collection_1 = __importDefault(require("./Collection"));
let Analysis = Analysis_1 = class Analysis extends typeorm_1.BaseEntity {
    id;
    collectionIds;
    pgn;
    authorId;
    forkedFromId;
    title;
    description;
    forkedFrom;
    author;
    visibility;
    tagData;
    collections;
    static async verifyAuthor(id, userid) {
        const analysis = await this.findOneBy({ id });
        if (!analysis)
            return false;
        return analysis.authorId === userid;
    }
    static async addToCollections(id, collections) {
        const analysis = await this.findOneBy({ id });
        if (!analysis)
            throw new Error("Analysis does not exits");
        collections.forEach((collection) => {
            analysis.collectionIds.push(collection);
        });
        const updated = await analysis.save();
        return updated;
    }
    static async getAllByUser(userid) {
        const analyses = await this.find({
            where: {
                author: { id: userid },
            },
        });
        return analyses;
    }
    static async updateById(id, updates) {
        const analysis = await this.findOneBy({ id });
        if (!analysis)
            throw new Error("Analysis does not exits");
        Object.assign(analysis, updates);
        const updated = await analysis.save();
        return updated;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Analysis.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", array: true, nullable: true }),
    __metadata("design:type", Array)
], Analysis.prototype, "collectionIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Analysis.prototype, "pgn", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Analysis.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Analysis.prototype, "forkedFromId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Analysis.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Analysis.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Analysis_1),
    (0, typeorm_1.JoinColumn)({ name: "forkedFromId", referencedColumnName: "id" }),
    __metadata("design:type", Analysis)
], Analysis.prototype, "forkedFrom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, (user) => user.savedAnalyses),
    (0, typeorm_1.JoinColumn)({ name: "authorId", referencedColumnName: "id" }),
    __metadata("design:type", Object)
], Analysis.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, default: "unlisted" }),
    __metadata("design:type", String)
], Analysis.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb" }),
    __metadata("design:type", Object)
], Analysis.prototype, "tagData", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Collection_1.default, (collection) => collection.analyses, { cascade: true }),
    (0, typeorm_1.JoinTable)({
        name: "collections_join_table",
        joinColumn: {
            name: "collectionIds",
            referencedColumnName: "id",
        },
    }),
    __metadata("design:type", Object)
], Analysis.prototype, "collections", void 0);
Analysis = Analysis_1 = __decorate([
    (0, typeorm_1.Entity)()
], Analysis);
exports.default = Analysis;
