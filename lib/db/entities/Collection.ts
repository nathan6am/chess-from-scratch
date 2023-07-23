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
  In,
} from "typeorm";
import Analysis from "./Analysis";
import type { Relation } from "typeorm";
import User from "./User";
@Entity()
export default class Collection extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @ManyToMany(() => Analysis, (analysis) => analysis.collections)
  analyses: Relation<Analysis[]>;

  @ManyToOne(() => User, (user) => user.collections)
  user: Relation<User>;

  static async getByIds(ids: string[]) {
    const collections = await this.findBy({
      id: In(ids),
    });
    return collections;
  }
  static async userCollections(userid: string) {
    const collections = await this.find({
      where: {
        user: { id: userid },
      },
    });
    return collections;
  }
  static async createNew(title: string, user: User) {
    const collection = new Collection();
    Object.assign(collection, { title, user });
    await collection.save();
    return collection;
  }
  static async deleteCollection(id: string) {
    const collection = await this.findOneBy({ id });
    if (!collection) throw new Error("Collection not found");
    await collection.remove();
  }
  static async addAnalysis(id: string, analysisId: string) {
    const collection = await this.findOneBy({ id });
    if (!collection) throw new Error("Collection not found");
    const analysis = await Analysis.findOneBy({ id: analysisId });
    if (!analysis) throw new Error("Analysis not found");
    collection.analyses.push(analysis);
    await collection.save();
    return collection;
  }

  static async removeAnalysis(id: string, analysisId: string) {
    const collection = await this.findOneBy({ id });
    if (!collection) throw new Error("Collection not found");
    collection.analyses = collection.analyses.filter((analysis) => analysis.id !== analysisId);
    await collection.save();
    return collection;
  }

  static async renameCollection(id: string, title: string) {
    const collection = await this.findOneBy({ id });
    if (!collection) throw new Error("Collection not found");
    collection.title = title;
    await collection.save();
    return collection;
  }
}
