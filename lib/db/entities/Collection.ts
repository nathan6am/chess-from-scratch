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
}
