import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  ILike,
  JoinTable,
} from "typeorm";
import type { Relation } from "typeorm";
import User from "./User";
import Collection from "./Collection";
import type { PGNTagData } from "@/util/parsers/pgnParser";

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

  @Column({ type: "jsonb" })
  tags: PGNTagData;

  @Column()
  moveText: string;

  @ManyToMany(() => Collection, (collection) => collection.analyses, { cascade: true })
  @JoinTable({
    name: "collections_join_table",
    joinColumn: {
      name: "collectionIds",
      referencedColumnName: "id",
    },
  })
  collections: Relation<Collection[]>;

  static async verifyAuthor(id: string, userid: string) {
    const analysis = await this.findOneBy({ id });
    if (!analysis) return false;
    return analysis.authorId === userid;
  }
  static async addToCollections(id: string, collections: string[]) {
    const analysis = await this.findOneBy({ id });
    if (!analysis) throw new Error("Analysis does not exits");
    collections.forEach((collection) => {
      analysis.collectionIds.push(collection);
    });
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
}
