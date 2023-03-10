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

  @ManyToMany(() => Collection, (collection) => collection.analyses, { cascade: true })
  @JoinTable({
    name: "collections_join_table",
    joinColumn: {
      name: "collectionIds",
      referencedColumnName: "id",
    },
  })
  collections: Relation<Collection[]>;
}
