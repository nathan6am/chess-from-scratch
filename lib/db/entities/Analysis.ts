import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  JoinTable,
} from "typeorm";
import type { Relation } from "typeorm";
import User from "./User";
import Collection from "./Collection";
import type { PGNTagData } from "@/lib/types";

@Entity()
export default class Analysis extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", array: true, nullable: true })
  collectionIds: string[];

  @Column({ nullable: false })
  pgn: string;

  @Column()
  authorId: string;

  @Column({ nullable: true })
  forkedFromId: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Analysis)
  @JoinColumn({ name: "forkedFromId", referencedColumnName: "id" })
  forkedFrom: Analysis;

  @ManyToOne(() => User, (user) => user.savedAnalyses)
  @JoinColumn({ name: "authorId", referencedColumnName: "id" })
  author: Relation<User>;

  @Column({ nullable: false, default: "unlisted" })
  visibility: "private" | "unlisted" | "public";

  @UpdateDateColumn()
  lastUpdate: Date;

  @Column({ type: "jsonb" })
  tagData: PGNTagData;

  @ManyToMany(() => Collection, (collection) => collection.analyses, { cascade: true })
  @JoinTable()
  collections: Relation<Collection[]>;

  static async verifyAuthor(id: string, userid: string) {
    const analysis = await this.findOneBy({ id });
    if (!analysis) return false;
    return analysis.authorId === userid;
  }
  static async addToCollections(id: string, collections: string[]) {
    const analysis = await this.findOneBy({ id });
    if (!analysis) throw new Error("Analysis does not exits");
    const collectionEntities = await Collection.getByIds(collections);
    analysis.collections = collectionEntities;
    const updated = await analysis.save();
    return updated;
  }
  static async getAllByUser(userid: string) {
    const analyses = await this.find({
      where: {
        author: { id: userid },
      },
    });
    return analyses;
  }
  static async updateById(id: string, updates: Partial<Omit<Analysis, "id">>) {
    const analysis = await this.findOneBy({ id });
    if (!analysis) throw new Error("Analysis does not exits");
    Object.assign(analysis, updates);
    const updated = await analysis.save();
    return updated;
  }

  static async rename(id: string, title: string) {
    const analysis = await this.findOneBy({ id });
    if (!analysis) throw new Error("Analysis does not exits");
    analysis.title = title;
    const updated = await analysis.save();
    return updated;
  }

  static async searchMine(userid: string, searchParams: SearchParams) {
    const query = this.createQueryBuilder("analysis").where("analysis.authorId = :userid", { userid });
    if (searchParams.query) {
      query.andWhere("analysis.title ILIKE :query", { query: `%${searchParams.query}%` });
    }
    if (searchParams.sortBy) {
      query.orderBy(`analysis.${searchParams.sortBy}`, searchParams.sortDirection || "ASC");
    }
    if (searchParams.pageCursor) {
      query.skip((searchParams.pageSize || 10) * Number(searchParams.pageCursor));
    }
    query.take(searchParams.pageSize || 10);
    const analyses = await query.getMany();
    return analyses;
  }
}

interface SearchParams {
  query?: string;
  pageCursor?: string;
  pageSize?: number;
  sortBy?: "lastUpdate" | "title";
  sortDirection?: "ASC" | "DESC";
}
